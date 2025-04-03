//! Protocol definitions for the P2P network.

use crate::message::Message;
use libp2p::{
    request_response::{
        ProtocolName, ProtocolSupport, RequestResponse, RequestResponseConfig, RequestResponseEvent,
    },
    PeerId,
};
use std::io::{Error as IoError, ErrorKind, Read, Write};
use std::time::Duration;

/// The protocol name for the DarkSwap protocol.
#[derive(Debug, Clone)]
pub struct DarkSwapProtocol;

impl ProtocolName for DarkSwapProtocol {
    fn protocol_name(&self) -> &[u8] {
        b"/darkswap/1.0.0"
    }
}

/// Create a new request-response protocol for DarkSwap.
pub fn create_request_response(
    local_peer_id: PeerId,
) -> RequestResponse<DarkSwapProtocol, Message, Message> {
    let config = RequestResponseConfig::default()
        .set_request_timeout(Duration::from_secs(30))
        .with_max_concurrent_requests(32);

    RequestResponse::new(
        DarkSwapProtocol,
        vec![(DarkSwapProtocol, ProtocolSupport::Full)],
        config,
    )
}

/// The codec for the DarkSwap protocol.
#[derive(Debug, Clone)]
pub struct DarkSwapCodec;

impl libp2p::request_response::Codec for DarkSwapCodec {
    type Protocol = DarkSwapProtocol;
    type Request = Message;
    type Response = Message;

    fn read_request<'a>(
        &mut self,
        _: &Self::Protocol,
        io: &'a mut (dyn Read + Send + Unpin + 'a),
    ) -> Result<Self::Request, IoError> {
        read_message(io)
    }

    fn read_response<'a>(
        &mut self,
        _: &Self::Protocol,
        io: &'a mut (dyn Read + Send + Unpin + 'a),
    ) -> Result<Self::Response, IoError> {
        read_message(io)
    }

    fn write_request<'a>(
        &mut self,
        _: &Self::Protocol,
        io: &'a mut (dyn Write + Send + Unpin + 'a),
        req: Self::Request,
    ) -> Result<(), IoError> {
        write_message(io, req)
    }

    fn write_response<'a>(
        &mut self,
        _: &Self::Protocol,
        io: &'a mut (dyn Write + Send + Unpin + 'a),
        res: Self::Response,
    ) -> Result<(), IoError> {
        write_message(io, res)
    }
}

/// Read a message from the given I/O.
fn read_message<R>(io: &mut R) -> Result<Message, IoError>
where
    R: Read,
{
    // Read the message length
    let mut len_bytes = [0u8; 4];
    io.read_exact(&mut len_bytes)?;
    let len = u32::from_be_bytes(len_bytes) as usize;

    // Read the message
    let mut buf = vec![0u8; len];
    io.read_exact(&mut buf)?;

    // Deserialize the message
    let message = serde_json::from_slice(&buf)
        .map_err(|e| IoError::new(ErrorKind::InvalidData, e))?;

    Ok(message)
}

/// Write a message to the given I/O.
fn write_message<W>(io: &mut W, message: Message) -> Result<(), IoError>
where
    W: Write,
{
    // Serialize the message
    let buf = serde_json::to_vec(&message)
        .map_err(|e| IoError::new(ErrorKind::InvalidData, e))?;

    // Write the message length
    let len = buf.len() as u32;
    io.write_all(&len.to_be_bytes())?;

    // Write the message
    io.write_all(&buf)?;
    io.flush()?;

    Ok(())
}