//! Protocol definitions for the P2P network.

use crate::message::Message;
use futures::io::{AsyncRead, AsyncWrite};
use libp2p::{
    request_response::{
        ProtocolName, ProtocolSupport, RequestResponse, RequestResponseCodec, RequestResponseConfig, RequestResponseEvent,
    },
    PeerId,
};
use std::io::{Error as IoError, ErrorKind};
use std::time::Duration;

/// The protocol name for the DarkSwap protocol.
#[derive(Debug, Clone)]
pub struct DarkSwapProtocol;

impl ProtocolName for DarkSwapProtocol {
    fn protocol_name(&self) -> &[u8] {
        b"/darkswap/1.0.0"
    }
}

/// The codec for the DarkSwap protocol.
#[derive(Debug, Clone)]
pub struct DarkSwapCodec;

impl RequestResponseCodec for DarkSwapCodec {
    type Protocol = DarkSwapProtocol;
    type Request = Message;
    type Response = Message;

    async fn read_request<'a, T>(
        &mut self,
        _: &Self::Protocol,
        io: &'a mut T,
    ) -> Result<Self::Request, IoError>
    where
        T: AsyncRead + Unpin + Send + 'a,
    {
        read_message(io).await
    }

    async fn read_response<'a, T>(
        &mut self,
        _: &Self::Protocol,
        io: &'a mut T,
    ) -> Result<Self::Response, IoError>
    where
        T: AsyncRead + Unpin + Send + 'a,
    {
        read_message(io).await
    }

    async fn write_request<'a, T>(
        &mut self,
        _: &Self::Protocol,
        io: &'a mut T,
        req: Self::Request,
    ) -> Result<(), IoError>
    where
        T: AsyncWrite + Unpin + Send + 'a,
    {
        write_message(io, req).await
    }

    async fn write_response<'a, T>(
        &mut self,
        _: &Self::Protocol,
        io: &'a mut T,
        res: Self::Response,
    ) -> Result<(), IoError>
    where
        T: AsyncWrite + Unpin + Send + 'a,
    {
        write_message(io, res).await
    }
}

/// Create a new request-response protocol for DarkSwap.
pub fn create_request_response(
    _local_peer_id: PeerId,
) -> RequestResponse<DarkSwapCodec> {
    let mut config = RequestResponseConfig::default();
    config.set_request_timeout(Duration::from_secs(30));
    // Note: with_max_concurrent_requests is not available in this version
    // We'll use the default value

    RequestResponse::new(
        DarkSwapCodec,
        vec![(DarkSwapProtocol, ProtocolSupport::Full)],
        config,
    )
}

/// Read a message from the given I/O.
async fn read_message<'a, R>(io: &'a mut R) -> Result<Message, IoError>
where
    R: AsyncRead + Unpin + 'a,
{
    use futures::io::AsyncReadExt;
    
    // Read the message length
    let mut len_bytes = [0u8; 4];
    io.read_exact(&mut len_bytes).await?;
    let len = u32::from_be_bytes(len_bytes) as usize;

    // Read the message
    let mut buf = vec![0u8; len];
    io.read_exact(&mut buf).await?;

    // Deserialize the message
    let message = serde_json::from_slice(&buf)
        .map_err(|e| IoError::new(ErrorKind::InvalidData, e))?;

    Ok(message)
}

/// Write a message to the given I/O.
async fn write_message<'a, W>(io: &'a mut W, message: Message) -> Result<(), IoError>
where
    W: AsyncWrite + Unpin + 'a,
{
    use futures::io::AsyncWriteExt;
    
    // Serialize the message
    let buf = serde_json::to_vec(&message)
        .map_err(|e| IoError::new(ErrorKind::InvalidData, e))?;

    // Write the message length
    let len = buf.len() as u32;
    io.write_all(&len.to_be_bytes()).await?;

    // Write the message
    io.write_all(&buf).await?;
    io.flush().await?;

    Ok(())
}