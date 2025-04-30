#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Rpc {
    #[prost(message, repeated, tag = "1")]
    pub subscriptions: ::prost::alloc::vec::Vec<rpc::SubOpts>,
    #[prost(message, repeated, tag = "2")]
    pub publish: ::prost::alloc::vec::Vec<Message>,
    #[prost(message, optional, tag = "3")]
    pub control: ::core::option::Option<ControlMessage>,
}
/// Nested message and enum types in `RPC`.
pub mod rpc {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Message)]
    pub struct SubOpts {
        /// subscribe or unsubscribe
        #[prost(bool, optional, tag = "1")]
        pub subscribe: ::core::option::Option<bool>,
        #[prost(string, optional, tag = "2")]
        pub topic_id: ::core::option::Option<::prost::alloc::string::String>,
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Message {
    #[prost(bytes = "vec", optional, tag = "1")]
    pub from: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bytes = "vec", optional, tag = "2")]
    pub data: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bytes = "vec", optional, tag = "3")]
    pub seqno: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(string, required, tag = "4")]
    pub topic: ::prost::alloc::string::String,
    #[prost(bytes = "vec", optional, tag = "5")]
    pub signature: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bytes = "vec", optional, tag = "6")]
    pub key: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ControlMessage {
    #[prost(message, repeated, tag = "1")]
    pub ihave: ::prost::alloc::vec::Vec<ControlIHave>,
    #[prost(message, repeated, tag = "2")]
    pub iwant: ::prost::alloc::vec::Vec<ControlIWant>,
    #[prost(message, repeated, tag = "3")]
    pub graft: ::prost::alloc::vec::Vec<ControlGraft>,
    #[prost(message, repeated, tag = "4")]
    pub prune: ::prost::alloc::vec::Vec<ControlPrune>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ControlIHave {
    #[prost(string, optional, tag = "1")]
    pub topic_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(bytes = "vec", repeated, tag = "2")]
    pub message_ids: ::prost::alloc::vec::Vec<::prost::alloc::vec::Vec<u8>>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ControlIWant {
    #[prost(bytes = "vec", repeated, tag = "1")]
    pub message_ids: ::prost::alloc::vec::Vec<::prost::alloc::vec::Vec<u8>>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ControlGraft {
    #[prost(string, optional, tag = "1")]
    pub topic_id: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ControlPrune {
    #[prost(string, optional, tag = "1")]
    pub topic_id: ::core::option::Option<::prost::alloc::string::String>,
    /// gossipsub v1.1 PX
    #[prost(message, repeated, tag = "2")]
    pub peers: ::prost::alloc::vec::Vec<PeerInfo>,
    /// gossipsub v1.1 backoff time (in seconds)
    #[prost(uint64, optional, tag = "3")]
    pub backoff: ::core::option::Option<u64>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PeerInfo {
    #[prost(bytes = "vec", optional, tag = "1")]
    pub peer_id: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bytes = "vec", optional, tag = "2")]
    pub signed_peer_record: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
}
/// topicID = hash(topicDescriptor); (not the topic.name)
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TopicDescriptor {
    #[prost(string, optional, tag = "1")]
    pub name: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(message, optional, tag = "2")]
    pub auth: ::core::option::Option<topic_descriptor::AuthOpts>,
    #[prost(message, optional, tag = "3")]
    pub enc: ::core::option::Option<topic_descriptor::EncOpts>,
}
/// Nested message and enum types in `TopicDescriptor`.
pub mod topic_descriptor {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Message)]
    pub struct AuthOpts {
        #[prost(enumeration = "auth_opts::AuthMode", optional, tag = "1")]
        pub mode: ::core::option::Option<i32>,
        /// root keys to trust
        #[prost(bytes = "vec", repeated, tag = "2")]
        pub keys: ::prost::alloc::vec::Vec<::prost::alloc::vec::Vec<u8>>,
    }
    /// Nested message and enum types in `AuthOpts`.
    pub mod auth_opts {
        #[derive(
            Clone,
            Copy,
            Debug,
            PartialEq,
            Eq,
            Hash,
            PartialOrd,
            Ord,
            ::prost::Enumeration
        )]
        #[repr(i32)]
        pub enum AuthMode {
            /// no authentication, anyone can publish
            None = 0,
            /// only messages signed by keys in the topic descriptor are accepted
            Key = 1,
            /// web of trust, certificates can allow publisher set to grow
            Wot = 2,
        }
        impl AuthMode {
            /// String value of the enum field names used in the ProtoBuf definition.
            ///
            /// The values are not transformed in any way and thus are considered stable
            /// (if the ProtoBuf definition does not change) and safe for programmatic use.
            pub fn as_str_name(&self) -> &'static str {
                match self {
                    AuthMode::None => "NONE",
                    AuthMode::Key => "KEY",
                    AuthMode::Wot => "WOT",
                }
            }
            /// Creates an enum from field names used in the ProtoBuf definition.
            pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
                match value {
                    "NONE" => Some(Self::None),
                    "KEY" => Some(Self::Key),
                    "WOT" => Some(Self::Wot),
                    _ => None,
                }
            }
        }
    }
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Message)]
    pub struct EncOpts {
        #[prost(enumeration = "enc_opts::EncMode", optional, tag = "1")]
        pub mode: ::core::option::Option<i32>,
        /// the hashes of the shared keys used (salted)
        #[prost(bytes = "vec", repeated, tag = "2")]
        pub key_hashes: ::prost::alloc::vec::Vec<::prost::alloc::vec::Vec<u8>>,
    }
    /// Nested message and enum types in `EncOpts`.
    pub mod enc_opts {
        #[derive(
            Clone,
            Copy,
            Debug,
            PartialEq,
            Eq,
            Hash,
            PartialOrd,
            Ord,
            ::prost::Enumeration
        )]
        #[repr(i32)]
        pub enum EncMode {
            /// no encryption, anyone can read
            None = 0,
            /// messages are encrypted with shared key
            Sharedkey = 1,
            /// web of trust, certificates can allow publisher set to grow
            Wot = 2,
        }
        impl EncMode {
            /// String value of the enum field names used in the ProtoBuf definition.
            ///
            /// The values are not transformed in any way and thus are considered stable
            /// (if the ProtoBuf definition does not change) and safe for programmatic use.
            pub fn as_str_name(&self) -> &'static str {
                match self {
                    EncMode::None => "NONE",
                    EncMode::Sharedkey => "SHAREDKEY",
                    EncMode::Wot => "WOT",
                }
            }
            /// Creates an enum from field names used in the ProtoBuf definition.
            pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
                match value {
                    "NONE" => Some(Self::None),
                    "SHAREDKEY" => Some(Self::Sharedkey),
                    "WOT" => Some(Self::Wot),
                    _ => None,
                }
            }
        }
    }
}
