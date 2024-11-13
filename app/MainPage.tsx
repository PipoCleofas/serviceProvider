import React, { useState, useEffect } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import { useNavigation } from 'expo-router';
import useLocation from '../hooks/useLocation';
import useHandleLogin from '@/hooks/useHandleLogin';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MarkerType {
  latitude: number;
  longitude: number;
  title: string;
}

const markerImages: { [key: string]: any } = {
  "BFP": require('../assets/images/fire.png'),
  "PNP": require('../assets/images/police.webp'),
  "Medical": require('../assets/images/medic.png'),
  "NDRRMC": require('../assets/images/ndrrmc.png'),
  "PDRRMO": require('../assets/images/ndrrmc.png'),
  "BFP Assistance Request": require('../assets/images/fire.png'),
  "PNP Assistance Request": require('../assets/images/police.webp'),
  "Medical Assistance Request": require('../assets/images/medic.png'),
  "NDRRMC Assistance Request": require('../assets/images/ndrrmc.png'),
  "PDRRMO Assistance Request": require('../assets/images/ndrrmc.png'),
};

const getMarkerImage = (title: string) => {
  return markerImages[title]; // Fallback to default
};

export default function MainPage() {
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [serviceProvided, setServiceProvided] = useState<string | null>();
  const [nameInNeed, setNameInNeed] = useState<string | null>();
  const [message, setMessage] = useState<string | null>('');
  const [messageError, setMessageError] = useState<string | null>();

  const { location, errorMsg, isFetching, latitude, longitude, title } = useLocation();
  const { markerUnameEmoji, markerImageSize, imageChanger } = useHandleLogin();

  const defaultRegion = {
    latitude: 15.4817,
    longitude: 120.5979,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  async function handleSendMessage() {
    try {
      if (!serviceProvided || !nameInNeed || !message) {
        setMessageError('Fill up the requirements');
        return;
      }
      const finalMessage = `The Service Provided is ${serviceProvided}. The name of the person in need is ${nameInNeed}. ${message}`;
      await axios.post("https://fearless-growth-production.up.railway.app/messaging/submit", {
        message: finalMessage
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      setModalVisible(false);
      setMessageError(null);
    } catch (err: any) {
      console.error('Error sending message:', err.message);
    }
  }

    const fetchAndUpdateMarker = async () => {
      try {
        const username = await AsyncStorage.getItem('usernameSP');
        const userId = await AsyncStorage.getItem('userId');
    
        if (!username || latitude === null || longitude === null) return;
    
        const response = await fetch(`https://fearless-growth-production.up.railway.app/marker/getMarker/${username}`);
        const data = await response.json();
        if (Array.isArray(data)) setMarkers(data);
    
        try {
          const checkResponse = await axios.get(`https://fearless-growth-production.up.railway.app/marker/checkMarkerTitleExists`, {
            params: { title: username },
          });
    
          if (checkResponse.status === 200 && checkResponse.data?.data) {
            await axios.put(`https://fearless-growth-production.up.railway.app/marker/updateMarker/${username}`, {
              newLatitude: latitude,
              newLongitude: longitude,
            });
          }
        } catch (error: any) {
          // Handle 404 error from `checkMarkerTitleExists` here
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            await axios.post(`https://fearless-growth-production.up.railway.app/marker/${username}/submitMarkerSP`, {
              lat: latitude,
              long: longitude,
              description: 'test',
              UserID: userId,
              title: username
            });
          } else {
            console.error('Error in checkMarkerTitleExists:', error.message);
          }
        }
      } catch (error: any) {
        console.error('Unexpected error in fetchAndUpdateMarker:', error.message);
      }
    };
    
    useEffect(() => {
      // Set an interval to periodically call fetchAndUpdateMarker every 3 seconds
      const intervalId = setInterval(fetchAndUpdateMarker, 3000);
      imageChanger()
      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }, [latitude, longitude]);


  useEffect(() => {
    if (latitude && longitude && title) {
      setMarkers((prevMarkers) => [
        ...prevMarkers,
        { latitude, longitude, title },
      ]);
    }
  }, [latitude, longitude, title]);

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.modalBackground}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.label}>Name of the person in need</Text>
            <TextInput style={modalStyles.input} onChangeText={setNameInNeed} maxLength={30} />
            <Text style={modalStyles.label}>Service Provided</Text>
            <TextInput style={modalStyles.input} onChangeText={setServiceProvided} maxLength={10} />
            <Text style={modalStyles.label}>Message (include time and date)</Text>
            <TextInput style={[modalStyles.input, modalStyles.textArea]} onChangeText={setMessage} multiline={true} maxLength={100} />
            {messageError && <Text style={modalStyles.errorText}>{messageError}</Text>}
            <View style={modalStyles.buttonContainer}>
              <Pressable style={modalStyles.button} onPress={handleSendMessage}>
                <Text style={modalStyles.buttonText}>Send</Text>
              </Pressable>
              <Pressable style={modalStyles.button} onPress={() => setModalVisible(false)}>
                <Text style={modalStyles.buttonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {!isFetching && location && location.coords && <Text>Fetching location...</Text>}
      {errorMsg && <Text>{errorMsg}</Text>}
      {!isFetching && location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={defaultRegion}
          region={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} title="You are here" description="Your current location">
            <Image source={markerUnameEmoji} style={{ width: markerImageSize.width, height: markerImageSize.height }} />
          </Marker>
          {markers.map((marker, index) => (
            marker.latitude && marker.longitude ? (
              <Marker
                key={index}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={marker.title || "No Title"}
                description={`Latitude: ${marker.latitude}, Longitude: ${marker.longitude}`}
              >
                <Image source={getMarkerImage(marker.title)} style={{ width: 45, height: 45 }} />
              </Marker>
            ) : null
          ))}
        </MapView>
      )}

      <View style={styles.tabBarContainer}>
        <View style={styles.iconContainer}>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, isPressed ? styles.buttonPressed : null]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.buttonText}>Send Updates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '80%', 
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarContainer: {
    width: '100%',
    height: '20%', 
    backgroundColor: 'white',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, 
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    borderWidth: 2,         
    borderColor: '#FFD700', 
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    backgroundColor: '#FFFDD0',
    padding: 5,
    width: 50,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    color: 'black',
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#AD5765',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    shadowColor: 'transparent',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
   modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonbar: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    marginTop: 5,
    backgroundColor: '#1E90FF',
  },
  textStyle: {
    color: 'white',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    
    color: 'white',
  },
  buttonModal: {
    flexDirection: 'column',
  },
  servicesContainerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  
});

const modalStyles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top', // For multiline input
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});