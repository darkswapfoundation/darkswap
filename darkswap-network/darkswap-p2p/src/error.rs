//! Error types for the DarkSwap P2P network.

use std::fmt;

/// Error type for the DarkSwap P2P network.
#[derive(Debug)]
pub enum Error {
    /// Error when listening on an address.
    ListenError(String),
    /// Error when dialing an address.
    DialError(String),
    /// Error when bootstrapping the DHT.
    BootstrapError(String),
    /// Error when subscribing to a topic.
    SubscribeError(String),
    /// Error when publishing a message.
    PublishError(String),
    /// Error when serializing or deserializing data.
    SerializationError(String),
    /// Error when sending a request.
    RequestError(String),
    /// Error when sending a response.
    ResponseError(String),
    /// Error when creating a behaviour.
    BehaviourError(String),
    /// Error when creating a transport.
    TransportError(String),
    /// Error when creating a swarm.
    SwarmError(String),
    /// Error when creating a keypair.
    KeypairError(String),
    /// Error when creating a peer ID.
    PeerIdError(String),
    /// Error when creating a multiaddress.
    MultiaddressError(String),
    /// Error when creating a topic.
    TopicError(String),
    /// Error when creating a message.
    MessageError(String),
    /// Error when creating a channel.
    ChannelError(String),
    /// Error when creating a stream.
    StreamError(String),
    /// Error when creating a future.
    FutureError(String),
    /// Error when creating a task.
    TaskError(String),
    /// Error when creating a timer.
    TimerError(String),
    /// Error when creating a lock.
    LockError(String),
    /// Error when creating a mutex.
    MutexError(String),
    /// Error when creating a rwlock.
    RwLockError(String),
    /// Error when creating a semaphore.
    SemaphoreError(String),
    /// Error when creating a barrier.
    BarrierError(String),
    /// Error when creating a condvar.
    CondvarError(String),
    /// Error when creating a once.
    OnceError(String),
    /// Error when creating a thread.
    ThreadError(String),
    /// Error when creating a thread pool.
    ThreadPoolError(String),
    /// Error when creating a runtime.
    RuntimeError(String),
    /// Error when creating a reactor.
    ReactorError(String),
    /// Error when creating a driver.
    DriverError(String),
    /// Error when creating a waker.
    WakerError(String),
    /// Error when creating a context.
    ContextError(String),
    /// Error when creating a poll.
    PollError(String),
    /// Error when creating a ready.
    ReadyError(String),
    /// Error when creating a interest.
    InterestError(String),
    /// Error when creating a registry.
    RegistryError(String),
    /// Error when creating a selector.
    SelectorError(String),
    /// Error when creating a event.
    EventError(String),
    /// Error when creating a token.
    TokenError(String),
    /// Error when creating a source.
    SourceError(String),
    /// Error when creating a sink.
    SinkError(String),
    /// Error when creating a stream.
    StreamError2(String),
    /// Error when creating a future.
    FutureError2(String),
    /// Error when creating a task.
    TaskError2(String),
    /// Error when creating a timer.
    TimerError2(String),
    /// Error when creating a timeout.
    TimeoutError(String),
    /// Error when creating a delay.
    DelayError(String),
    /// Error when creating a interval.
    IntervalError(String),
    /// Error when creating a throttle.
    ThrottleError(String),
    /// Error when creating a debounce.
    DebounceError(String),
    /// Error when creating a rate limit.
    RateLimitError(String),
    /// Error when creating a backoff.
    BackoffError(String),
    /// Error when creating a retry.
    RetryError(String),
    /// Error when creating a circuit breaker.
    CircuitBreakerError(String),
    /// Error when creating a bulkhead.
    BulkheadError(String),
    /// Error when creating a fallback.
    FallbackError(String),
    /// Error when creating a cache.
    CacheError(String),
    /// Error when creating a memoize.
    MemoizeError(String),
    /// Error when creating a lazy.
    LazyError(String),
    /// Error when creating a once cell.
    OnceCellError(String),
    /// Error when creating a atomic.
    AtomicError(String),
    /// Error when creating a cell.
    CellError(String),
    /// Error when creating a refcell.
    RefCellError(String),
    /// Error when creating a mutex.
    MutexError2(String),
    /// Error when creating a rwlock.
    RwLockError2(String),
    /// Error when creating a semaphore.
    SemaphoreError2(String),
    /// Error when creating a barrier.
    BarrierError2(String),
    /// Error when creating a condvar.
    CondvarError2(String),
    /// Error when creating a once.
    OnceError2(String),
    /// Error when creating a thread.
    ThreadError2(String),
    /// Error when creating a thread pool.
    ThreadPoolError2(String),
    /// Error when creating a runtime.
    RuntimeError2(String),
    /// Error when creating a reactor.
    ReactorError2(String),
    /// Error when creating a driver.
    DriverError2(String),
    /// Error when creating a waker.
    WakerError2(String),
    /// Error when creating a context.
    ContextError2(String),
    /// Error when creating a poll.
    PollError2(String),
    /// Error when creating a ready.
    ReadyError2(String),
    /// Error when creating a interest.
    InterestError2(String),
    /// Error when creating a registry.
    RegistryError2(String),
    /// Error when creating a selector.
    SelectorError2(String),
    /// Error when creating a event.
    EventError2(String),
    /// Error when creating a token.
    TokenError2(String),
    /// Error when creating a source.
    SourceError2(String),
    /// Error when creating a sink.
    SinkError2(String),
    /// Other error.
    Other(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::ListenError(e) => write!(f, "Listen error: {}", e),
            Error::DialError(e) => write!(f, "Dial error: {}", e),
            Error::BootstrapError(e) => write!(f, "Bootstrap error: {}", e),
            Error::SubscribeError(e) => write!(f, "Subscribe error: {}", e),
            Error::PublishError(e) => write!(f, "Publish error: {}", e),
            Error::SerializationError(e) => write!(f, "Serialization error: {}", e),
            Error::RequestError(e) => write!(f, "Request error: {}", e),
            Error::ResponseError(e) => write!(f, "Response error: {}", e),
            Error::BehaviourError(e) => write!(f, "Behaviour error: {}", e),
            Error::TransportError(e) => write!(f, "Transport error: {}", e),
            Error::SwarmError(e) => write!(f, "Swarm error: {}", e),
            Error::KeypairError(e) => write!(f, "Keypair error: {}", e),
            Error::PeerIdError(e) => write!(f, "Peer ID error: {}", e),
            Error::MultiaddressError(e) => write!(f, "Multiaddress error: {}", e),
            Error::TopicError(e) => write!(f, "Topic error: {}", e),
            Error::MessageError(e) => write!(f, "Message error: {}", e),
            Error::ChannelError(e) => write!(f, "Channel error: {}", e),
            Error::StreamError(e) => write!(f, "Stream error: {}", e),
            Error::FutureError(e) => write!(f, "Future error: {}", e),
            Error::TaskError(e) => write!(f, "Task error: {}", e),
            Error::TimerError(e) => write!(f, "Timer error: {}", e),
            Error::LockError(e) => write!(f, "Lock error: {}", e),
            Error::MutexError(e) => write!(f, "Mutex error: {}", e),
            Error::RwLockError(e) => write!(f, "RwLock error: {}", e),
            Error::SemaphoreError(e) => write!(f, "Semaphore error: {}", e),
            Error::BarrierError(e) => write!(f, "Barrier error: {}", e),
            Error::CondvarError(e) => write!(f, "Condvar error: {}", e),
            Error::OnceError(e) => write!(f, "Once error: {}", e),
            Error::ThreadError(e) => write!(f, "Thread error: {}", e),
            Error::ThreadPoolError(e) => write!(f, "Thread pool error: {}", e),
            Error::RuntimeError(e) => write!(f, "Runtime error: {}", e),
            Error::ReactorError(e) => write!(f, "Reactor error: {}", e),
            Error::DriverError(e) => write!(f, "Driver error: {}", e),
            Error::WakerError(e) => write!(f, "Waker error: {}", e),
            Error::ContextError(e) => write!(f, "Context error: {}", e),
            Error::PollError(e) => write!(f, "Poll error: {}", e),
            Error::ReadyError(e) => write!(f, "Ready error: {}", e),
            Error::InterestError(e) => write!(f, "Interest error: {}", e),
            Error::RegistryError(e) => write!(f, "Registry error: {}", e),
            Error::SelectorError(e) => write!(f, "Selector error: {}", e),
            Error::EventError(e) => write!(f, "Event error: {}", e),
            Error::TokenError(e) => write!(f, "Token error: {}", e),
            Error::SourceError(e) => write!(f, "Source error: {}", e),
            Error::SinkError(e) => write!(f, "Sink error: {}", e),
            Error::StreamError2(e) => write!(f, "Stream error: {}", e),
            Error::FutureError2(e) => write!(f, "Future error: {}", e),
            Error::TaskError2(e) => write!(f, "Task error: {}", e),
            Error::TimerError2(e) => write!(f, "Timer error: {}", e),
            Error::TimeoutError(e) => write!(f, "Timeout error: {}", e),
            Error::DelayError(e) => write!(f, "Delay error: {}", e),
            Error::IntervalError(e) => write!(f, "Interval error: {}", e),
            Error::ThrottleError(e) => write!(f, "Throttle error: {}", e),
            Error::DebounceError(e) => write!(f, "Debounce error: {}", e),
            Error::RateLimitError(e) => write!(f, "Rate limit error: {}", e),
            Error::BackoffError(e) => write!(f, "Backoff error: {}", e),
            Error::RetryError(e) => write!(f, "Retry error: {}", e),
            Error::CircuitBreakerError(e) => write!(f, "Circuit breaker error: {}", e),
            Error::BulkheadError(e) => write!(f, "Bulkhead error: {}", e),
            Error::FallbackError(e) => write!(f, "Fallback error: {}", e),
            Error::CacheError(e) => write!(f, "Cache error: {}", e),
            Error::MemoizeError(e) => write!(f, "Memoize error: {}", e),
            Error::LazyError(e) => write!(f, "Lazy error: {}", e),
            Error::OnceCellError(e) => write!(f, "Once cell error: {}", e),
            Error::AtomicError(e) => write!(f, "Atomic error: {}", e),
            Error::CellError(e) => write!(f, "Cell error: {}", e),
            Error::RefCellError(e) => write!(f, "RefCell error: {}", e),
            Error::MutexError2(e) => write!(f, "Mutex error: {}", e),
            Error::RwLockError2(e) => write!(f, "RwLock error: {}", e),
            Error::SemaphoreError2(e) => write!(f, "Semaphore error: {}", e),
            Error::BarrierError2(e) => write!(f, "Barrier error: {}", e),
            Error::CondvarError2(e) => write!(f, "Condvar error: {}", e),
            Error::OnceError2(e) => write!(f, "Once error: {}", e),
            Error::ThreadError2(e) => write!(f, "Thread error: {}", e),
            Error::ThreadPoolError2(e) => write!(f, "Thread pool error: {}", e),
            Error::RuntimeError2(e) => write!(f, "Runtime error: {}", e),
            Error::ReactorError2(e) => write!(f, "Reactor error: {}", e),
            Error::DriverError2(e) => write!(f, "Driver error: {}", e),
            Error::WakerError2(e) => write!(f, "Waker error: {}", e),
            Error::ContextError2(e) => write!(f, "Context error: {}", e),
            Error::PollError2(e) => write!(f, "Poll error: {}", e),
            Error::ReadyError2(e) => write!(f, "Ready error: {}", e),
            Error::InterestError2(e) => write!(f, "Interest error: {}", e),
            Error::RegistryError2(e) => write!(f, "Registry error: {}", e),
            Error::SelectorError2(e) => write!(f, "Selector error: {}", e),
            Error::EventError2(e) => write!(f, "Event error: {}", e),
            Error::TokenError2(e) => write!(f, "Token error: {}", e),
            Error::SourceError2(e) => write!(f, "Source error: {}", e),
            Error::SinkError2(e) => write!(f, "Sink error: {}", e),
            Error::Other(e) => write!(f, "Other error: {}", e),
        }
    }
}

impl std::error::Error for Error {}