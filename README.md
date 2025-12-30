> [!NOTE]
> This code relates to version 1.x of QRL, the world's first open-source PQ blockchain, which has been securing digital assets since December 2016.
> The next generation of QRL, version 2.0, is in development and has its own repositories. See [this discussion page](https://github.com/orgs/theQRL/discussions/2).

 QRL Block Explorer

[![Build Status](https://travis-ci.org/theQRL/block-explorer.svg?branch=master)](https://travis-ci.org/theQRL/block-explorer) [![Code Climate](https://codeclimate.com/github/theQRL/block-explorer/badges/gpa.svg)](https://codeclimate.com/github/theQRL/block-explorer) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/3bc1e632eaad47358f2beb7db6b6b872)](https://www.codacy.com/app/qrl/block-explorer?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=theQRL/block-explorer&amp;utm_campaign=Badge_Grade)

Work in progress.

Currently running at: [https://explorer.theqrl.org/](https://explorer.theqrl.org/)

## Dependencies

[Meteor](https://www.meteor.com/install)

## Install

	git clone https://github.com/theQRL/block-explorer.git
	cd block-explorer
	meteor npm install
	meteor npm install --save babel-runtime meteor-node-stubs

## (Optional) Configuration

Edit `development.json`

## Run

	meteor

or

	meteor --settings development.json
