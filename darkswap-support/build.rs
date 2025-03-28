fn main() {
    let mut config = prost_build::Config::new();
    config.type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]");
    
    config.compile_protos(
        &["proto/p2p.proto", "proto/orderbook.proto", "proto/trade.proto"],
        &["proto/"],
    ).unwrap();
}