import React, { createContext, useContext, useState, useEffect } from 'react';
import {WEB3AUTH_NETWORK, WALLET_ADAPTERS  } from "@web3auth/base"
import { Web3Auth } from "@web3auth/modal";
import { connect, KeyPair, keyStores, utils } from "near-api-js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [web3auth, setWeb3auth] = useState(null);
    const [provider, setProvider] = useState(null);
    const [user, setUser] = useState(null);
    const [accountId, setAccountId] = useState(null);
    const [keyStore, setKeyStore] = useState(null);

    //const [keyPair, setKeyPair] = useState(null);
  
    useEffect(() => {
      const init = async () => {
        try {
        const web3auth = new Web3Auth({
          clientId: "BD20qYbO4GTKBNz5-4WVWLcPpTbQ_E6Hj0CHM_jTRzxwG0KkV-orb1HNUdFo7LZGlmnfLxm1nefjxNXy35nSUpI",
          web3AuthNetwork: "sapphire_devnet",
          chainConfig: {
            chainId: "testnet",
            chainNamespace: "other",
            rpcTarget: "https://rpc.testnet.near.org",
            displayName: "Near",
            blockExplorer: "https://explorer.testnet.near.org",
            ticker: "NEAR",
            tickerName: "NEAR",
          },
          uiConfig: {
            appName: "Smokefarmers Guest List",
            appUrl: "https://web3auth.io",
            defaultLanguage: "en", 
            mode: "dark",
            primaryButton: "socialLogin",
            theme: {
              primary: "#d63384",
            },
          },      
        });
        setWeb3auth(web3auth);
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
                [WALLET_ADAPTERS.WALLET_CONNECT_V2]: {
                  label: "wallet_connect",
                  showOnModal: false,
                },
                // Disable Metamask
                [WALLET_ADAPTERS.METAMASK]: {
                  label: "metamask",
                  showOnModal: false,
                },
              },
            },
          },
        });
        if (web3auth.provider) {
          setProvider(web3auth.provider);
        };
  
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
      getUserInfo()
    };
  
    const getUserInfo = async () => {
      if (!web3auth) {
        console.log("web3auth not initialized yet");
        return;
      }
      const user = await web3auth.getUserInfo();
      setUser(user)
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
    };

    const getKeys = async () => {
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
                
        return keyPair;
      } catch (error) {
        console.error(error);
      }
      
    };
  
    const getBalance = async () => {
      
      const ID = generateAccountId(user.email)
      setAccountId(ID)
      const keyPair = await getKeys();
      const newKeyStore = new keyStores.InMemoryKeyStore();
      await newKeyStore.setKey("testnet", ID, keyPair);
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
        const account = await near.createAccount(ID, keyPair.publicKey);
        const accountBalance = await account.getAccountBalance();
        const availableBalance = utils.format.formatNearAmount(accountBalance.available);
        return availableBalance.toString()
      } catch (error) {
        console.log(error)
      }
      
    };
    const getAccountID = async () => {
      if(accountId != null){
        return accountId;
      }else {
        const ID = generateAccountId(user.email)
        return ID
      }
    }

    const callContract = async (contractId, method, amount, gas = '30000000000000') => {

      const keyPair = await getKeys();
      const newKeyStore = new keyStores.InMemoryKeyStore();
      await newKeyStore.setKey("testnet", accountId, keyPair);
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

    function generateAccountId(email) {
      // Split the email at the '@' character and take the first part
      let userId = email.split('@')[0];
  
      // Keep only alphanumeric characters
      userId = userId.replace(/[^a-zA-Z0-9]/g, '');
  
      // If the userId is empty, hash the email
      if (userId.length === 0) {
          // Create a hash from the email
          let hash = crypto.createHash('sha256');
          hash.update(email);
          // Use the first 10 characters of the hexdigest
          userId = hash.digest('hex').substring(0, 10);
      }
  
      const timestamp = new Date().getTime();
      // Append the testnet domain
      return userId + timestamp + '.testnet';
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, callContract, getBalance, getAccountID}}>
      {children}
    </AuthContext.Provider>
  );
};
