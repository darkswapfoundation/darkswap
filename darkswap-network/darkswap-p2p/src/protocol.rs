//! Protocol definitions for the DarkSwap P2P network.

use crate::message::Message;
use futures::{AsyncRead, AsyncWrite};
use libp2p::{
    request_response::{
        ProtocolName, ProtocolSupport, RequestResponse, RequestResponseCodec, RequestResponseConfig,
    },
    PeerId,
};
use std::{
    future::Future,
    io,
    pin::Pin,
    task::{Context, Poll},
};

/// DarkSwap protocol name.
#[derive(Debug, Clone)]
pub struct DarkSwapProtocol;

impl ProtocolName for DarkSwapProtocol {
    fn protocol_name(&self) -> &[u8] {
        b"/darkswap/1.0.0"
    }
}

/// DarkSwap protocol codec.
#[derive(Clone)]
pub struct DarkSwapCodec;

impl RequestResponseCodec for DarkSwapCodec {
    type Protocol = DarkSwapProtocol;
    type Request = Message;
    type Response = Message;

    fn read_request<T>(
        &mut self,
        _: &DarkSwapProtocol,
        io: &mut T,
    ) -> Pin<Box<dyn Future<Output = io::Result<Self::Request>> + Send>>
    where
        T: AsyncRead + Unpin + Send,
    {
        Box::pin(async move {
            let mut buf = Vec::new();
            futures::io::AsyncReadExt::read_to_end(io, &mut buf).await?;
            serde_json::from_slice(&buf).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
        })
    }

    fn read_response<T>(
        &mut self,
        _: &DarkSwapProtocol,
        io: &mut T,
    ) -> Pin<Box<dyn Future<Output = io::Result<Self::Response>> + Send>>
    where
        T: AsyncRead + Unpin + Send,
    {
        Box::pin(async move {
            let mut buf = Vec::new();
            futures::io::AsyncReadExt::read_to_end(io, &mut buf).await?;
            serde_json::from_slice(&buf).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
        })
    }

    fn write_request<T>(
        &mut self,
        _: &DarkSwapProtocol,
        io: &mut T,
        req: Self::Request,
    ) -> Pin<Box<dyn Future<Output = io::Result<()>> + Send>>
    where
        T: AsyncWrite + Unpin + Send,
    {
        Box::pin(async move {
            let buf = serde_json::to_vec(&req)
                .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
            futures::io::AsyncWriteExt::write_all(io, &buf).await
        })
    }

    fn write_response<T>(
        &mut self,
        _: &DarkSwapProtocol,
        io: &mut T,
        res: Self::Response,
    ) -> Pin<Box<dyn Future<Output = io::Result<()>> + Send>>
    where
        T: AsyncWrite + Unpin + Send,
    {
        Box::pin(async move {
            let buf = serde_json::to_vec(&res)
                .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
            futures::io::AsyncWriteExt::write_all(io, &buf).await
        })
    }
}

/// Create a new request-response protocol.
pub fn create_request_response() -> RequestResponse<DarkSwapCodec> {
    let config = RequestResponseConfig::default();
    RequestResponse::new(
        DarkSwapCodec,
        vec![(DarkSwapProtocol, ProtocolSupport::Full)],
        config,
    )
}