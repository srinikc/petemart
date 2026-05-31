import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';

export default function AuthScreen() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleSendOtp = () => {
    if (phone.length === 10) setStep('otp');
  };

  const handleVerify = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF8EE]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-xl bg-[#C8A45C] items-center justify-center mb-4">
            <Text className="text-white font-bold text-2xl">PM</Text>
          </View>
          <Text className="text-2xl font-bold text-[#2D2D2D] mb-2">
            Welcome to PeteMart
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            {step === 'phone' ? 'Enter your phone number to get started' : 'Enter the OTP sent to your phone'}
          </Text>
        </View>

        {step === 'phone' ? (
          <View className="space-y-4">
            <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4">
              <Text className="text-gray-500 mr-2">+91</Text>
              <TextInput
                className="flex-1 h-12 text-base"
                placeholder="Phone Number"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <TouchableOpacity
              className={`py-3 rounded-xl ${phone.length === 10 ? 'bg-[#C8A45C]' : 'bg-gray-300'}`}
              onPress={handleSendOtp}
              disabled={phone.length !== 10}
            >
              <Text className="text-white text-center font-semibold text-base">Send OTP</Text>
            </TouchableOpacity>

            <View className="bg-[#C8A45C]/10 rounded-xl p-4 border border-[#C8A45C]/20">
              <Text className="text-xs text-gray-500">
                Demo: 9999999999 (Customer), 8888888888 (Merchant), 7777777777 (Admin). OTP: 123456
              </Text>
            </View>
          </View>
        ) : (
          <View className="space-y-4">
            <View className="flex-row justify-center gap-2">
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  className="w-12 h-14 bg-white rounded-xl border border-gray-200 text-center text-xl font-bold"
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(val) => {
                    const newOtp = [...otp];
                    newOtp[i] = val;
                    setOtp(newOtp);
                  }}
                />
              ))}
            </View>
            <TouchableOpacity
              className="py-3 rounded-xl bg-[#C8A45C]"
              onPress={handleVerify}
            >
              <Text className="text-white text-center font-semibold text-base">Verify & Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}>
              <Text className="text-center text-sm text-[#C8A45C]">Change Number</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
