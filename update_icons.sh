#!/bin/bash

# Update lasttx template to use consistent icon styling
sed -i 's|<img class="w-8 h-8" src="/img/icons/send.svg" alt="Transfer" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M8 4a1 1 0 011-1h2a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2V4z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/mining.svg" alt="Coinbase" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/message.svg" alt="Message" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/token.svg" alt="Token Transfer" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/token.svg" alt="Token Creation" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/slave.svg" alt="Slave" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/lattice.svg" alt="Lattice" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/multisig.svg" alt="Multi-Sig Create" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/multisig.svg" alt="Multi-Sig Spend" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/vote.svg" alt="Vote" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/nft.svg" alt="NFT Transfer" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

sed -i 's|<img class="w-8 h-8" src="/img/icons/nft.svg" alt="NFT Creation" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

