import React, { createContext, useContext, useState, useEffect } from 'react';
import {WALLET_ADAPTERS  } from "@web3auth/base"
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { connect, KeyPair, keyStores, utils } from "near-api-js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const chainConfig = {
  chainNamespace: "other",
  chainId: "0x4e454153",
  rpcTarget: "https://testnet.aurora.dev",
  displayName: "Near",
  blockExplorer: "https://explorer.testnet.aurora.dev",
  ticker: "NEAR",
  tickerName: "NEAR",
};

export const AuthProvider = ({ children }) => {
    const [web3auth, setWeb3auth] = useState(null);
    const [provider, setProvider] = useState(null);
    const [account, setAccount] = useState(null);
    const [user, setUser] = useState(null);
  
    useEffect(() => {
      const init = async () => {
        try {
        const web3auth = new Web3Auth({
          clientId: "BD20qYbO4GTKBNz5-4WVWLcPpTbQ_E6Hj0CHM_jTRzxwG0KkV-orb1HNUdFo7LZGlmnfLxm1nefjxNXy35nSUpI",
          web3AuthNetwork: "sapphire_devnet",
          chainConfig,
          uiConfig: {
            appName: "Smokefarmers Guest List",
            appUrl: "https://web3auth.io",
            defaultLanguage: "en", 
            mode: "dark",
            primaryButton: "externalLogin",
            theme: {
              primary: "#d63384",
            },
          },      
        });

               
        await web3auth.initModal({
          modalConfig: {
            [WALLET_ADAPTERS.OPENLOGIN]: {
              label: "openlogin",
              loginMethods: {
                // Disable facebook and reddit
                twitter: {
                  name: "twitter",
                  showOnModal: false,
                },
                wechat: {
                  name: "wechat",
                  showOnModal: false,
                },
                weibo: {
                  name: "weibo",
                  showOnModal: false,
                },
                kakao: {
                  name: "kakao",
                  showOnModal: false,
                },
                line: {
                  name: "line",
                  showOnModal: false,
                },
                facebook: {
                  name: "facebook",
                  showOnModal: false,
                },
                reddit: {
                  name: "reddit",
                  showOnModal: false,
                },
                sms_passwordless: {
                  name: "sms_passwordless",
                  showOnModal: false,
                },
              },
            },
          },
        });   

        setWeb3auth(web3auth);
        
        } catch (error) {
          console.error(error);
        }
      };
  
      init();
    }, []);
  
    const login = async () => {
      if (!web3auth) {
        console.log("web3auth not initialized yet");
        return;
      }

      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      
      const user = await web3auth.getUserInfo();
      setUser(user)
    };
  
    const getAccount = async () => {

      if (!provider) {
        console.error("Provider is not available");
        return;
      }

      try{
        const keyData  = await provider.request({ method: "private_key" });
      
        const privateKey  = keyData;
        // Convert the secp256k1 key to ed25519 key
        const { getED25519Key } = await import("@toruslabs/openlogin-ed25519");
        const privateKeyEd25519 = getED25519Key(privateKey).sk.toString("hex");

        // Convert the private key to Buffer
        const privateKeyEd25519Buffer = Buffer.from(privateKeyEd25519, "hex");

        // Convert the private key to base58
        const bs58encode = utils.serialize.base_encode(privateKeyEd25519Buffer);

        // Convert the base58 private key to KeyPair
        const keyPair = KeyPair.fromString(bs58encode);
        
        const publicAddress = keyPair?.getPublicKey().toString();
        const accountID = utils.serialize.base_decode(publicAddress.split(":")[1]).toString("hex");

        const newKeyStore = new keyStores.InMemoryKeyStore();
        await newKeyStore.setKey("testnet", accountID, keyPair);
        const connectionConfig = {
          networkId: "testnet",
          keyStore: newKeyStore,
          nodeUrl: "https://rpc.testnet.near.org",
          walletUrl: "https://wallet.testnet.near.org",
          helperUrl: "https://helper.testnet.near.org",
          explorerUrl: "https://explorer.testnet.near.org",
        };
  
        const near = await connect(connectionConfig);
        try {
          console.log("Account abfrage");
          const account = await near.account(accountID);
          return account;
      } catch (error) {
          console.log("Konto nicht gefunden, Fehler:", error);
      
          try {
              const account = await near.createAccount(accountID, keyPair.publicKey);
              setAccount(account);
              console.log("Konto erstellt");
              return account;
          } catch (createAccountError) {
              console.error("Konto konnte nicht erstellt werden:", createAccountError);
          }
      }
  
      } catch (error) {
        console.error(error);
      }

    };
  
    const getBalance = async () => {
      const balance = getAccount()
      .then(account => {
        const accountBalance = account.getAccountBalance();
        const availableBalance = utils.format.formatNearAmount(accountBalance.available);
        return availableBalance.toString()
      })
      .catch(error => {
          console.error("Fehler beim Abrufen des Kontos:", error);
      });
      return balance 
    };

    const getWalletAddress = async () => {
      const walletAddress = getAccount()
      .then(account => {
        return account.accountId
      })
      .catch(error => {
          console.error("Fehler beim Abrufen des Kontos:", error);
      });
      return walletAddress 
    };

    const callContract = async (contractId, method, amount, gas = '30000000000000') => {

      const newKeyStore = new keyStores.InMemoryKeyStore();
      await newKeyStore.setKey("testnet", this.accountId, this.keyPair);
      const connectionConfig = {
        networkId: "testnet",
        keyStore: newKeyStore,
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
      };
      const near = await connect(connectionConfig);

      try {
        let deposit = utils.format.parseNearAmount(amount.toString())
        const account = await near.account(accountId);
        console.log("Call function");
        
        const tx = await account.functionCall({
          contractId: contractId,
          methodName: method,
          gas: gas, 
          attachedDeposit: deposit
        });
        
        console.log("function called");     
      }catch (error) {
        console.log(error)
      }
    };

    const logout = async () => {
      if (!web3auth) {
        console.log("web3auth not initialized yet");
        return;
      }
      await web3auth.logout();
      setProvider(null);
      setUser(null);
    };

  return (
    <AuthContext.Provider value={{ login, logout, callContract, getBalance, user, getWalletAddress}}>
      {children}
    </AuthContext.Provider>
  );
};
