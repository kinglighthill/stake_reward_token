import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

import contractJson from "./abi.json"

import React, { useEffect, useState } from "react"

import { ethers } from "ethers"

require('dotenv').config()

var bigInt = require("big-integer");

// Constants
const TWITTER_HANDLE = 'kingholyhill';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// const CONTRACT_ADDRESS = "0x822644cA01bdB8158291f3039237686b191CEc0b"

const CONTRACT_ADDRESS = "0xD5401aCeE1FA35dbfc9C5074a013652774c48A89"

const TOKEN_SYMBOL = "SRT"

let ethereum
let stakeRewardContract

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [stakedToken, setStakedToken] = useState(0)
  const [totalStakedTokens, setTotalStakedTokens] = useState(0)
  const [stakeValue, setStakeValue] = useState('')
  const [buyValue, setBuyValue] = useState('')
  const [transferValue, setTransferValue] = useState('')
  const [transferAddress, setTransferAddress] = useState('')

  const checkIfWalletIsConnected = async () => {
    try {
      ethereum = window.ethereum

      if (ethereum) {
        if (ethereum.isMetaMask) {
          const accounts = await ethereum.request({
            method: 'eth_requestAccounts'
          })

          const address = accounts[0].toString()

          console.log('Connected with Public Key: ', address)
          
          setWalletAddress(address)
          getContract()
        }
      } else {
        alert('Ethereum object not found! Get a Metamask Wallet  👻')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    ethereum  = window.ethereum

    if (ethereum) {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })

      const provider = await getProvider()
      await provider.send("eth_requestAccounts", accounts);

      const signer = provider.getSigner()

      const address = await signer.getAddress()
      
      console.log('Connected with Public Key: ', address.toString())
      setWalletAddress(address.toString())
      getContract()
    } else {
      alert('Ethereum object not found! Get a Metamask Wallet  👻')
    }
  }

  const getProvider = async () => {
    const provider = new ethers.providers.Web3Provider(ethereum)
    return provider
  } 

  const getSigner = async () => {
    const provider = await getProvider()
    return provider.getSigner()
  } 

  const getContract = async () => {
    const signer = await getSigner()
    stakeRewardContract = new ethers.Contract(CONTRACT_ADDRESS, contractJson.abi, signer)

    console.log("Contract: ", stakeRewardContract)

    await fetchData()
  }

  const fetchData = async () => {
    getBalance()
    getStakedToken()
    getTotalStakedTokens()
  }

  const getRate = async () => {
    return await stakeRewardContract.tokensPerEther()
  }

  const getBalance = async () => {
    const signer = await getSigner()
    const address = await signer.getAddress()
    
    const balance = await stakeRewardContract.balanceOf(address)
    const decimals = await stakeRewardContract.decimals()
    
    const tokenBal = balance / (10 ** decimals)
    setTokenBalance(tokenBal)
  }

  const getStakedToken = async () => {
    const signer = await getSigner()
    const address = await signer.getAddress()
    
    const stake = await stakeRewardContract.stakeOf(address)
    const decimals = await stakeRewardContract.decimals()

    const stakedToken = stake / 10 ** decimals
    setStakedToken(stakedToken)
  }

  const getTotalStakedTokens = async () => {
    const totalStakes = await stakeRewardContract.totalStakes()
    const decimals = await stakeRewardContract.decimals()

    const totalStakedTokens = totalStakes / 10 ** decimals
    setTotalStakedTokens(totalStakedTokens)
  }

  const stakeToken = async () => {
    try {
      if (stakeValue > tokenBalance) {
        alert(`You don't have up to ${stakeValue} ${TOKEN_SYMBOL} in your wallet. You can buy more tokens`)
      }

      const staked = await stakeRewardContract.stakeToken(parseInt(stakeValue))
      if (staked === true) {
        await getStakedToken()
        await getTotalStakedTokens()
      }
    } catch(error) {
      console.error(error)
    }
  }

  const buyToken = async () => {
    try {
      const rate = await getRate() || 1000
      const tokenInEther = parseInt(buyValue) / rate

      alert(`You will be charged ${tokenInEther} ethers plus additional gas fees for this transaction`)

      const options = {value: ethers.utils.parseEther(tokenInEther.toString())}
      const bought = await stakeRewardContract.buyToken(options)
      if (bought === true) {
        await getBalance()
      }
    } catch(error) {
      console.error(error)
    }
  }

  const transferToken = async () => {
    try {
      if (transferValue > tokenBalance) {
        alert(`You don't have up to ${transferValue} ${TOKEN_SYMBOL} in your wallet. You can buy more tokens`)
      }

      const decimals = await stakeRewardContract.decimals()
      const tokens = bigInt(parseInt(transferValue) * 10 ** decimals)
      const transfered = await stakeRewardContract.transfer(transferAddress, tokens.value)

      if (transfered === true) {
        await getBalance()
      }

    } catch(error) {
      console.error(error)
    }
  }

  const onInputChange = (event, type) => {
    const { value } = event.target
    
    if (type === "stake") {
      setStakeValue(value)
    } else if (type === "buy") {
      setBuyValue(value)
    } else if (type === "transfer") {
      setTransferValue(value)
    } else if (type === "address") {
      setTransferAddress(value)
    }
  }

  const renderNotConnectContainer = () => (
    <button className='cta-button connect-wallet-button' onClick={connectWallet}>
      Connect to Wallet
    </button>
  )

  const renderConnectedContainer = () => {
    return (
      <div className='connected-container'>
        <div>
          <p>Balance: {tokenBalance} {TOKEN_SYMBOL}</p>
        </div>
        <div>
          <p>Staked Tokens: {stakedToken} {TOKEN_SYMBOL}</p>
        </div>
        <div>
          <p>Total tokens staked on the platform: {totalStakedTokens} {TOKEN_SYMBOL}</p>
        </div>
        <form onSubmit={(event) => {
          event.preventDefault()
          stakeToken()
        }}>
          <input type="text" placeholder="Tokens" value={stakeValue} onChange={ (event) => onInputChange(event, "stake") } />
          <button type="submit" className="cta-button submit-button">Stake</button>
        </form>
        <form onSubmit={(event) => {
          event.preventDefault()
          buyToken()
        }}>
          <label>1000 {TOKEN_SYMBOL} per ether</label>
          <input type="text" placeholder="Tokens" value={buyValue} onChange={ (event) => onInputChange(event, "buy") } />
          <button type="submit" className="cta-button submit-button">Buy</button>
        </form>
        <form onSubmit={(event) => {
          event.preventDefault()
          transferToken()
        }}>
          <input type="text" placeholder="Tokens" value={transferValue} onChange={ (event) => onInputChange(event, "transfer") } />
          <input type="text" placeholder="Address" value={transferAddress} onChange={ (event) => onInputChange(event, "address") } />
          <button type="submit" className="cta-button submit-button">Transfer</button>
        </form>
      </div>
    )
  }
 
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    }

    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  })

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 STK ERC20 Token</p>
          <p className="sub-text">
            Stake and get rewarded weekly ✨
          </p>
          {!walletAddress && renderNotConnectContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by ${TWITTER_HANDLE} runs on rinkeby`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
