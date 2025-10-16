#!/bin/bash

# Update lasttx template with specific icons for each transaction type

# Transfer icon (arrow right)
sed -i 's|<img class="w-8 h-8" src="/img/icons/send.svg" alt="Transfer" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Mining/Coinbase icon (diamond/pickaxe)
sed -i 's|<img class="w-8 h-8" src="/img/icons/mining.svg" alt="Coinbase" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Message icon (chat bubble)
sed -i 's|<img class="w-8 h-8" src="/img/icons/message.svg" alt="Message" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Token icon (coin/token)
sed -i 's|<img class="w-8 h-8" src="/img/icons/token.svg" alt="Token Transfer" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Token Creation icon (plus coin)
sed -i 's|<img class="w-8 h-8" src="/img/icons/token.svg" alt="Token Creation" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Slave icon (link/chain)
sed -i 's|<img class="w-8 h-8" src="/img/icons/slave.svg" alt="Slave" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Lattice icon (grid/lattice)
sed -i 's|<img class="w-8 h-8" src="/img/icons/lattice.svg" alt="Lattice" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Multi-sig icon (multiple people)
sed -i 's|<img class="w-8 h-8" src="/img/icons/multisig.svg" alt="Multi-Sig Create" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Multi-sig Spend icon (same as create)
sed -i 's|<img class="w-8 h-8" src="/img/icons/multisig.svg" alt="Multi-Sig Spend" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# Vote icon (checkmark)
sed -i 's|<img class="w-8 h-8" src="/img/icons/vote.svg" alt="Vote" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# NFT icon (star/unique)
sed -i 's|<img class="w-8 h-8" src="/img/icons/nft.svg" alt="NFT Transfer" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

# NFT Creation icon (star with plus)
sed -i 's|<img class="w-8 h-8" src="/img/icons/nft.svg" alt="NFT Creation" />|<div class="w-8 h-8 bg-qrl-accent rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-qrl-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg></div>|g' /Users/jp/block-explorer/imports/ui/components/lasttx/lasttx.html

