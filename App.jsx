import {
  ConnectWallet,
  embeddedWallet,
  localWallet,
  metamaskWallet,
  rainbowWallet,
  smartWallet,
  ThirdwebProvider,
  trustWallet,
  useAddress,
  walletConnect,
  useContractEvents,
} from '@thirdweb-dev/react-native';
import React, {useEffect} from 'react';
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {TW_CLIENT_ID} from '@env';
import {NdefTools, HceTools} from 'react-native-nfc-sdk';

import {useContractWrite, useContract} from '@thirdweb-dev/react-native';
import {ethers} from 'ethers';
import nfcManager from 'react-native-nfc-manager';

const App = () => {
  const smartWalletConfig = {
    factoryAddress: '0xB209Edc477A4B4794BE111b046399Cd7e209271E',
    gasless: true,
  };

  return (
    <ThirdwebProvider
      activeChain="mumbai"
      clientId={TW_CLIENT_ID} // uncomment this line after you set your clientId in the .env file
      supportedWallets={[
        smartWallet(embeddedWallet(), smartWalletConfig),
        smartWallet(localWallet(), smartWalletConfig),
      ]}>
      <AppInner />
    </ThirdwebProvider>
  );
};

const AppInner = () => {
  const address = useAddress();
  const isDarkMode = useColorScheme() === 'dark';
  const ndef = new NdefTools();
  const [tagContent, setTagContent] = React.useState('');
  const [amount, setAmount] = React.useState(0);

  const hce = new HceTools();
  const [isTagRead, setIsTagRead] = React.useState('No');

  const contractAddress = '0x196387aA93106f288437a057C65A8B5295cEeBf0';
  const {contract} = useContract(contractAddress);

  const {mutateAsync, isLoading, error} = useContractWrite(
    contract,
    'transfer',
  );

  // useEffect(async () => {
  //   // get the initial launching tag
  //   const bgTag = await nfcManager.getBackgroundTag();
  //   readTag(bgTag);

  //   // listen to other background tags after the app launched
  //   nfcManager.setEventListener(
  //     NfcEvents.DiscoverBackgroundTag,
  //     onBackgroundTag,
  //   );
  // }, []);

  const emulate = () => {
    // Send Address and amount
    hce.startEmulation(
      {content: `${address}+${amount}`, writable: false},
      () => {
        setIsTagRead('Yes!');
        setTimeout(() => setIsTagRead('No'), 5000);
      },
    );
  };

  // OLD READ TAG CODE
  // ==========================================
  // const readTag = async () => {
  //   // The read tag function sets an event handler for when a tag
  //   // is read and returns a js object of
  //   // {id: 'nfc-id', content: 'decoded-payload'}
  //   try {
  //     // Read the address and amount. Then call the mutateAsync function from useContractWrite
  //     // Loading animation should be there and finally an alert or toast
  //     const tag = await ndef.readTag();
  //     if (tag) {
  //       setTagContent(tag.content);
  //       const arr = tag.content.split('+');
  //       const payee = arr[0];
  //       let amt = arr[1];
  //       // TODO: Hardcoding decimals for testing. Please change
  //       amt = ethers.utils.parseEther(`${amt}`);
  //       console.log('addr:' + payee + ' amount:' + amt);
  //       mutateAsync({args: [payee, amt]}).then(() => {
  //         Alert.alert('Success', `${amt} sent successfully`);
  //       });
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  //   ndef.cancelRequest(); // Cancel the request to the nfc hardware
  // };

  // ==========================================

  // NEW CODE

  // https://link.trustwallet.com/send?asset=c20000714&address=0x8dc75d0168228B0Daa9aa8cA9f22cd80d9EcC3D4&amount=0.001

  const readTag = async () => {
    try {
      // Read the address and amount and add it
      const tag = await ndef.readTag();
      if (tag) {
        setTagContent(tag.content);
        const arr = tag.content.split('+');
        const addr = arr[0];
        let amt = arr[1];
        // Alert.alert('Success', `Called ReadTag`);
        const deepLinkUrl = `https://link.trustwallet.com/send?asset=c20000714&address=${addr}&amount=${amt}`;
        Linking.openURL(deepLinkUrl);
      }
    } catch (err) {
      console.error(err);
    }
    ndef.cancelRequest(); // Cancel the request to the nfc hardware
  };

  const textStyles = {
    color: isDarkMode ? Colors.white : Colors.black,
    ...styles.heading,
  };

  return (
    <View style={styles.view}>
      <Text style={textStyles}>Qwik Pay</Text>
      <ConnectWallet />
      {address && (
        <View>
          <View style={styles.payContainer}>
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Button onPress={readTag} title="Pay" disabled={isLoading} />
              {isLoading && <ActivityIndicator color="#fff" />}
            </View>
            <Text>TAG CONTENT: {tagContent}</Text>
          </View>

          <View style={styles.receiveContainer}>
            <TextInput
              onChangeText={value => setAmount(value)}
              keyboardType="numeric"
              value={amount}
              style={styles.input}
            />
            <Button onPress={emulate} title="Receive" />
            <Text>Was the tag read? {isTagRead}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    marginVertical: 20,
    borderWidth: 1,
    padding: 10,
  },
  payContainer: {
    marginTop: 40,
  },
  receiveContainer: {
    marginTop: 20,
  },
});

export default App;
