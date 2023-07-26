import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TextInput} from 'react-native';

export default function InputField({
  placeHolder,
  text,
  setText,
  validationRegex,
  errorMessage,
  onValidChange,
  secureEntry,
}) {
  const [borderColor, setBorderColor] = useState('rgba(123, 123, 123, 0.25)');
  const [error, setError] = useState(false);

  const InputFieldStyles = StyleSheet.create({
    field: {
      position: 'relative',
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 20,
      marginVertical: 10,

      // flex: 1,
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: '#ddd',
      backgroundColor: '#fff',
      marginRight: 8,
    },
    errorText: {
      color: '#FF0000',
      marginLeft: 20,
      marginTop: 5,
      alignSelf: 'flex-start',
    },
  });

  useEffect(() => {
    const isValid = text.match(validationRegex);
    if (!isValid && text.length > 0) {
      setBorderColor('#FF0000');
      setError(true);
    } else {
      setBorderColor('rgba(123, 123, 123, 0.25)');
      setError(false);
    }
    onValidChange(isValid);
  }, [text]);

  return (
    <>
      <TextInput
        placeholder={placeHolder}
        style={InputFieldStyles.field}
        placeholderTextColor={'#888'}
        value={text}
        onChangeText={setText}
        secureTextEntry={secureEntry}
      />
      {error && errorMessage && <Text style={InputFieldStyles.errorText}>{errorMessage}</Text>}
    </>
  );
}
