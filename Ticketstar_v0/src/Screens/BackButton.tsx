import React from "react";
import AntDesign from "react-native-vector-icons/AntDesign";
import { Text } from "react-native";

export const BackButton = ({navigation, goBack, params, styles, onPress}) => {

  const handleBackButton = () => {

    if (onPress){
      onPress();
    }

    if (goBack){
      navigation.goBack();
    } else {
      navigation.navigate(params);
    }

  }

  return (
    <Text
      style={[{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1,
      }, styles]}
      onPress={handleBackButton}
    >
      <AntDesign name={'left'} size={30}/>
    </Text>
  )

}
