module.exports = (req, res, next) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // Custom endpoints
  
  // Get peer ID
  if (req.path === '/peer/id') {
    return res.json({
      success: true,
      data: {
        peerId: '12D3KooWHFrmLWTTDD4NodngtRMmCCPcpZMEBZDXhGZ1FydNEMTK'
      }
    });
  }
  
  // Get connected peers
  if (req.path === '/peer/connected') {
    return res.json({
      success: true,
      data: {
        peers: [
          '12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg',
          '12D3KooWPBFzpNemfrwjMSTSQpQQBXKJhQxGRjGYWyBiKL5oNMYS',
          '12D3KooWQYzCrTUdJ8C7L3Uj9UQPi2xvwCNUBr2VEBwAQTJv8CgD'
        ]
      }
    });
  }
  
  // Get Bitcoin balance
  if (req.path === '/wallet/balance/bitcoin') {
    return res.json({
      success: true,
      data: {
        balance: 100000000 // 1 BTC
      }
    });
  }
  
  // Get rune balance
  if (req.path.startsWith('/wallet/balance/rune/')) {
    const runeId = req.path.split('/').pop();
    let balance = 0;
    
    if (runeId === 'rune-1') {
      balance = 1000;
    } else if (runeId === 'rune-2') {
      balance = 2000;
    }
    
    return res.json({
      success: true,
      data: {
        balance
      }
    });
  }
  
  // Get alkane balance
  if (req.path.startsWith('/wallet/balance/alkane/')) {
    const alkaneId = req.path.split('/').pop();
    let balance = 0;
    
    if (alkaneId === 'alkane-1') {
      balance = 500;
    } else if (alkaneId === 'alkane-2') {
      balance = 1000;
    }
    
    return res.json({
      success: true,
      data: {
        balance
      }
    });
  }
  
  // Get all balances
  if (req.path === '/wallet/balances') {
    return res.json({
      success: true,
      data: {
        balances: {
          'bitcoin': 100000000,
          'rune:rune-1': 1000,
          'rune:rune-2': 2000,
          'alkane:alkane-1': 500,
          'alkane:alkane-2': 1000
        }
      }
    });
  }
  
  // Create trade offer
  if (req.path === '/trade/offer' && req.method === 'POST') {
    // Generate a random offer ID
    const offerId = `offer-${Math.floor(Math.random() * 1000)}`;
    
    return res.json({
      success: true,
      data: {
        offerId
      }
    });
  }
  
  // Accept trade offer
  if (req.path.match(/\/trade\/offer\/.*\/accept/) && req.method === 'POST') {
    return res.json({
      success: true,
      data: {
        success: true
      }
    });
  }
  
  // Cancel trade offer
  if (req.path.match(/\/trade\/offer\/.*\/cancel/) && req.method === 'POST') {
    return res.json({
      success: true,
      data: {
        success: true
      }
    });
  }
  
  // Get trade offers
  if (req.path === '/trade/offers') {
    return res.json({
      success: true,
      data: {
        offers: [
          {
            id: 'offer-1',
            maker: '12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg',
            makerAsset: {
              type: 'bitcoin'
            },
            makerAmount: 100000000,
            takerAsset: {
              type: 'rune',
              id: 'rune-1'
            },
            takerAmount: 1000,
            expiry: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
            status: 'open'
          },
          {
            id: 'offer-2',
            maker: '12D3KooWPBFzpNemfrwjMSTSQpQQBXKJhQxGRjGYWyBiKL5oNMYS',
            makerAsset: {
              type: 'rune',
              id: 'rune-1'
            },
            makerAmount: 500,
            takerAsset: {
              type: 'bitcoin'
            },
            takerAmount: 50000000,
            expiry: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
            status: 'open'
          },
          {
            id: 'offer-3',
            maker: '12D3KooWQYzCrTUdJ8C7L3Uj9UQPi2xvwCNUBr2VEBwAQTJv8CgD',
            makerAsset: {
              type: 'alkane',
              id: 'alkane-1'
            },
            makerAmount: 200,
            takerAsset: {
              type: 'rune',
              id: 'rune-1'
            },
            takerAmount: 400,
            expiry: Math.floor(Date.now() / 1000) - 86400, // 1 day ago (expired)
            status: 'open'
          }
        ]
      }
    });
  }
  
  // Get trade history
  if (req.path === '/trade/history') {
    return res.json({
      success: true,
      data: {
        history: [
          {
            id: 'trade-1',
            timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
            type: 'buy',
            assetType: {
              type: 'rune',
              id: 'rune-1'
            },
            amount: 1000,
            price: 0.0001,
            status: 'completed'
          },
          {
            id: 'trade-2',
            timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
            type: 'sell',
            assetType: {
              type: 'alkane',
              id: 'alkane-1'
            },
            amount: 500,
            price: 0.0002,
            status: 'completed'
          }
        ]
      }
    });
  }
  
  // Continue to JSON Server for any other routes
  next();
};