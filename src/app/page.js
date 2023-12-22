'use client';
import { providers} from 'near-api-js';
import { useState, useEffect } from 'react';
import { HelloNearContract, NetworkId } from '../config';
import styles from './app.module.css';
import { useAuth } from '../wallets/authContext';
import { utils } from "near-api-js";

const CONTRACT = HelloNearContract[NetworkId];



export default function DonationCollector() {

  const [accountID, setAccountID] = useState('');
  const [balance, setBalance] = useState('');
  const [nearPrice, setNearPrice] = useState(3);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [beneficiary, setBeneficiary] = useState(["loading..."]);
  const [logInAlert, setlogInAlert] = useState("Please sign in with your NEAR wallet to make a donation.");
  const [donation, setDonation] = useState(0)
  const [donations, setDonations] = useState([
    { user: 'Could be You', amount: '100'  },
    { user: '', amount: '' },
    { user: '', amount: '' },
    // Ⓝ nicht vergessen beim setzten
  ]);
  const { user, callContract, getBalance, getAccountID} = useAuth();

  const fetchContractInfo = async (contractId, method, args = {}) => {{
    const provider = new providers.JsonRpcProvider({ url: 'https://rpc.testnet.near.org' });
    let res = await provider.query({
      request_type: 'call_function',
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
    return JSON.parse(Buffer.from(res.result).toString());
  }};

  const fetchContractArray = async (contractId, method, args = {}) => {{
    const provider = new providers.JsonRpcProvider({ url: 'https://rpc.testnet.near.org' });
    let res = await provider.query({
      request_type: 'call_function',
      account_id: contractId,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      method_name: method,
      finality: 'optimistic',
    });
    const donationsData  = JSON.parse(Buffer.from(res.result).toString())
    const formattedDonations = donationsData.map(donation => ({
      user: donation.account_id,
      amount: utils.format.formatNearAmount(donation.total_amount)
    })).reverse();
    return formattedDonations;
  }};

  useEffect(() => {
    setLoggedIn(!!user);
    const fetchBalance = async () => {
      if (user) {
        try {
          setlogInAlert('loading...');
          const balance =  await getBalance();
          const accountID = await getAccountID();
          const newAlert = `${accountID}: ${balance} Ⓝ`;
          setlogInAlert(newAlert);
          setAccountID(accountID)
          setBalance(balance)
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      } else {
        setlogInAlert("Please sign in with your NEAR wallet to make a donation.");
      }
    };
  
    try {
      fetchContractArray(CONTRACT,"getAllDonations").then(
        donationsArray => setDonations(donationsArray)
      );
      } catch (error) {
        console.error(error);
    }

    fetchBalance();
  }, [user]);

  useEffect(() => {
    try {
      fetchContractInfo(CONTRACT,"get_beneficiary").then(
        beneficiary => setBeneficiary(beneficiary)
      );
      getNearPriceInUSD().then(nearPriceInUSD => {
        if (nearPriceInUSD) {
          setNearPrice(nearPriceInUSD);
          console.log(nearPriceInUSD);
        }
      });
  
    } catch (error) {
      console.error(error);
    }
  }, []);

  async function getNearPriceInUSD() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd');
      const data = await response.json();
      const nearPrice = parseFloat(data.near.usd); // Ensure it is a number
  
      if (!isNaN(nearPrice) && nearPrice > 0) {
        return nearPrice; // The price of 1 NEAR in USD
      } else {
        throw new Error('Invalid NEAR price received');
      }
    } catch (error) {
      console.error("Error fetching NEAR price:", error);
      // You could return a fallback value or handle the error higher up in the component
      return null;
    }
  }

  const submitDonation = async () => {
    if(user){
      setShowSpinner(true);
      await callContract(CONTRACT, 'donate', donation);
      const balance =  await getBalance();
      const newAlert = `${accountID}: ${balance} Ⓝ`;
      setlogInAlert(newAlert);
      try {
        fetchContractArray(CONTRACT,"getAllDonations").then(
          donationsArray => setDonations(donationsArray)
        );
        } catch (error) {
          console.error(error);
      }
      setShowSpinner(false);
    }
  };

  return (
    <main className={styles.maincontainer}>
    <div className="p-4 p-sm-5">
      <div className="row d-flex justify-content-center">
        <div className="col-sm-6 pe-5 pe-sm-5 "  style={{ border: '2px solid var(--bs-code-color)', borderRadius: '8px'}}>
          <h2 style={{ padding: '2px', color: 'white'}}> Latest Donations </h2>
          <table className="table table-striped custom-table" style={{ width: '100%' }}>
          <colgroup>
            <col style={{ width: '50%' }} />
            <col style={{ width: '50%' }} />
          </colgroup>
            <thead>
              <tr >
                <th className="customth" scope="col">User</th>
                <th className="customth" scope="col">Total Donated Ⓝ</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation, index) => (
                <tr key={index}>
                  <td className="customtduser">
                    {donation.user || <div style={{ backgroundColor: 'rgba(0, 0, 0, 0)' , height: '25px' }}></div>}
                  </td>
                  <td className="customtdamount">
                    {donation.amount ? `${donation.amount} Ⓝ` : <div style={{ backgroundColor: 'rgba(0, 0, 0, 0)' , height: '25px' }}></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-sm-4">
          <div  className={styles.donationbox}>
            <div className={styles.donationboxhead}>
              <h4 style={{ color: "white" }} className="text-center"> Donate to <br></br><span style={{ color: "white" }} data-behavior="beneficiary">{beneficiary}</span></h4>
            </div>

              <div className={styles.donationboxbody}>
              <p style={{ textAlign: 'center', marginBottom: '1.5em', color: "white" }}>{logInAlert}</p>

              

                  <div className="row justify-content-center">
                    <div className="col-3 d-flex justify-content-center">
                      <button className="btn btn-outline-primary" onClick={() => setDonation(10/nearPrice)}> $ 10 </button>
                    </div>
                    <div className="col-3 d-flex justify-content-center">
                      <button className="btn btn-outline-primary" onClick={() => setDonation(20/nearPrice)}> $ 20 </button>
                    </div>
                    <div className="col-3 d-flex justify-content-center">
                      <button className="btn btn-outline-primary" onClick={() => setDonation(50/nearPrice)}> $ 50 </button>
                    </div>
                    <div className="col-3 d-flex justify-content-center">
                      <button className="btn btn-outline-primary" onClick={() => setDonation(100/nearPrice)}> $ 100 </button>
                  </div>

              
              </div>
              
                <fieldset className={styles.fieldset}>
                  <label htmlFor="donation" className="form-label">
                    Donation amount (in Ⓝ)
                  </label>
                  <div className="input-group">
                    <input className="form-control" defaultValue={donation} onChange={t => { setDonation(t.target.value); } }  />
                    <span className="input-group-text">Ⓝ</span>
                    <button onClick={submitDonation} className="btn btn-primary" >
                      <span hidden={showSpinner}> Donate </span>
                      <i className="spinner-border spinner-border-sm" hidden={!showSpinner}></i>
                    </button>
                  </div>
                </fieldset>
              </div>
          </div>
        </div>
      </div>

      <aside data-behavior="notification" style={{ display: 'none' }} className="bg-success p-2 text-white bg-opacity-75">
        Thank you! You have donated so far:
        <span data-behavior="donation-so-far"></span>Ⓝ
        <footer>
          <div>✔ Succeeded</div>
        </footer>
      </aside>
    </div>
    </main>
  );
}
