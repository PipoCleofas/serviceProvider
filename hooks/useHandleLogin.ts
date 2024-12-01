import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function useHandleLogin(){
    const [loginError, setLoginError] = useState<string | null>(null)
    let [uname,setUname] = useState<null | string>(null);
    let [password,setPassword] = useState<null | string>(null);
    const [markerEmoji, setMarkerEmoji] = useState<any>();
    const [markerUnameEmoji, setMarkerUnameEmoji] = useState<any>();

    const [markerImageSize, setMarkerImageSize] =useState<{width: any, height: any}> ({ width: 60, height: 60 });

    const navigation = useNavigation();

    const onUnameChange = (text: string) => {
        setUname(text);
    }

    const onPasswordChange = (text: string) => {
        setPassword(text)
    }

    function getFirstString(input: string): string {
      const medicalKeywords = ['DOCTORS', 'HOSPITAL', 'GENERAL', 'PROVINCIAL'];
      const words = input.split(' ');
  
      if (words.some(word => medicalKeywords.includes(word.toUpperCase()))) {
          return 'Medical';
      }
  
      return words[0];
  }
  
  
    const onLoginPress = async () => {
      try {
          const loginErr = validateLogin(uname, password);
          setLoginError(loginErr);
          console.log('Received username:', uname);
          console.log('Received password:', password);
          
          if (loginErr) {
              console.log(loginErr);
              return;
          }
  
          // First login request
          const response = await axios.get(
              'https://express-production-ac91.up.railway.app/serviceprovider/getServiceProvider',
              {
                  params: {
                      username: uname,
                      password: password,
                  },
              }
          );
  
          if (response.data.success) {
              console.log('Login successful');
              const userId = response.data.userId;
  
              if (userId) {
                  const servicetype = getFirstString(uname as string)
                  const service = AsyncStorage.setItem('service',servicetype); // Extract servicetype (e.g., "PNP")

                  

                  await AsyncStorage.setItem('usernameSP', uname as string);
                  await AsyncStorage.setItem('userId', userId.toString());
                  console.log('Username and User ID stored in AsyncStorage:', uname, userId);
  
                  await imageChanger();
  
                  navigation.navigate('MainPage' as never);
              } else {
                  console.error('User ID not found in response');
                  setLoginError('User ID not found in response');
              }
          } else {
              console.log('Login failed:', response.data.message);
              setLoginError(response.data.message);
          }
      } catch (err) {
          handleAxiosError(err);
      }
  };
  

  
  
     
  const validateLogin = (username: string | null, password: string | null) => {
      if (!username || username.trim() === "") {
        return "Username cannot be empty.";
      }
    
      if (!password || password.trim() === "") {
        return "Password cannot be empty.";
      }
    
      return null; 
  };
    
    async function imageChanger() {
        try {
          const uname = await AsyncStorage.getItem('usernameSP');
          if (uname) {
            switch (uname) {
              case 'BFP BRGY. SAN ISIDRO':
                setMarkerUnameEmoji(require('../assets/images/fire.png'));
                break;
              case 'BFP BRGY. SAN NICOLAS':
                setMarkerUnameEmoji(require('../assets/images/fire.png'));
                break;
              case 'BFP BRGY. SAN SEBASTIAN':
                setMarkerUnameEmoji(require('../assets/images/fire.png'));
                break;
              case 'PNP BRGY. SAN ISIDRO':
                setMarkerUnameEmoji(require('../assets/images/police.webp'));
                break;
              case 'PNP BRGY MABINI':
                setMarkerUnameEmoji(require('../assets/images/police.webp'));
                break;
              case 'PNP HILARIO STREET':
              setMarkerUnameEmoji(require('../assets/images/police.webp'));
              break;
              case 'TARLAC PROVINCIAL HOSPITAL':
                setMarkerUnameEmoji(require('../assets/images/medic.png'));
                break;
              case 'CENTRAL LUZON DOCTORS HOSPITAL':
                setMarkerUnameEmoji(require('../assets/images/medic.png'));
                break;
              case 'TALON GENERAL HOSPITAL':
                setMarkerUnameEmoji(require('../assets/images/medic.png'));
                break;
              case 'PDRRMO Station':
                setMarkerUnameEmoji(require('../assets/images/ndrrmc.png'));
                break;
            }
          } else {
            console.log('No username found in AsyncStorage');
          }
        } catch (error) {
          console.error('Error fetching username from AsyncStorage:', error);
        }
      }

    function handleAxiosError (error: any): void  {
        if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        } else if (error.request) {
        console.error('Request error:', error.request);
        } else {
        console.error('General error:', error.message);
        }
        console.error('Error config:', error.config);
    };
    

    return{
        onUnameChange,
        onPasswordChange,
        onLoginPress,
        markerEmoji,
        markerImageSize,
        loginError,
        markerUnameEmoji,
        imageChanger,
        uname
    }
}