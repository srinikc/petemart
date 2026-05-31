import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const MARKETS = [
  { name: 'Chickpet', desc: 'Textile Heart of Bangalore', storeCount: 118 },
  { name: 'Balepet', desc: 'Household & Everyday', storeCount: 85 },
  { name: 'Raja Market', desc: 'Jewellery & Crafts', storeCount: 62 },
];

export default function LandingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#FFF8EE]">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-lg bg-[#C8A45C] items-center justify-center">
                <Text className="text-white font-bold text-sm">PM</Text>
              </View>
              <Text className="text-xl font-bold text-[#6B1D3A]">
                Pete<Text className="text-[#C8A45C]">Mart</Text>
              </Text>
            </View>
            <Link href="/auth" asChild>
              <TouchableOpacity className="bg-[#C8A45C] px-4 py-2 rounded-lg">
                <Text className="text-white font-semibold text-sm">Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Hero */}
        <View className="px-4 py-8 bg-gradient-to-r from-[#6B1D3A]/80 to-[#6B1D3A]">
          <Text className="text-3xl font-bold text-white mb-2">
            Discover Old Bangalore
          </Text>
          <Text className="text-base text-white/80 mb-6">
            Shop from traditional merchants across historic Pete markets
          </Text>
          <Link href="/markets/chickpet" asChild>
            <TouchableOpacity className="bg-[#C8A45C] px-6 py-3 rounded-lg self-start">
              <Text className="text-white font-semibold">Explore Markets →</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Shop by Market */}
        <View className="px-4 py-6">
          <Text className="text-xl font-bold text-[#2D2D2D] mb-4">Shop by Market</Text>
          {MARKETS.map((market) => (
            <Link key={market.name} href={`/markets/${market.name.toLowerCase()}`} asChild>
              <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 border border-gray-200 shadow-sm">
                <Text className="text-base font-semibold text-[#2D2D2D]">{market.name}</Text>
                <Text className="text-sm text-gray-500">{market.desc} • {market.storeCount} stores</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        {/* How It Works */}
        <View className="px-4 py-6 bg-white">
          <Text className="text-xl font-bold text-[#2D2D2D] mb-4 text-center">How It Works</Text>
          <View className="flex-row justify-around">
            {[
              { step: '1', title: 'Browse', icon: '🔍' },
              { step: '2', title: 'Choose Mode', icon: '🛍️' },
              { step: '3', title: 'Get Delivery', icon: '🚚' },
            ].map((item) => (
              <View key={item.step} className="items-center">
                <Text className="text-3xl mb-2">{item.icon}</Text>
                <Text className="text-sm font-medium text-[#2D2D2D]">{item.title}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
