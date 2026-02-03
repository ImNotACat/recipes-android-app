import { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  Share
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useSession } from "../../../src/hooks/useSession";
import { 
  useHousehold, 
  useHouseholdMembers,
  useCreateHousehold, 
  useJoinHousehold, 
  useLeaveHousehold 
} from "../../../src/hooks/useHousehold";

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { data: household, isLoading: isLoadingHousehold } = useHousehold();
  const { data: members = [] } = useHouseholdMembers(household?.id);
  
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();
  const leaveHousehold = useLeaveHousehold();
  
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert("Error", "Please enter a household name");
      return;
    }
    
    try {
      await createHousehold.mutateAsync(householdName.trim());
      setHouseholdName("");
      setShowCreateForm(false);
      Alert.alert("Success", "Household created! Share the invite code with your family.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create household");
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }
    
    try {
      const joined = await joinHousehold.mutateAsync(inviteCode.trim());
      setInviteCode("");
      setShowJoinForm(false);
      Alert.alert("Success", `You've joined "${joined.name}"!`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to join household");
    }
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      "Leave Household",
      `Are you sure you want to leave "${household?.name}"? You will lose access to shared recipes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveHousehold.mutateAsync();
              Alert.alert("Success", "You've left the household");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to leave household");
            }
          },
        },
      ]
    );
  };

  const handleShareInviteCode = async () => {
    if (!household?.invite_code) return;
    
    try {
      await Share.share({
        message: `Join my household "${household.name}" on Recipes App! Use invite code: ${household.invite_code.toUpperCase()}`,
      });
    } catch (error) {
      // User cancelled or error
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-4">Settings</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-6 py-6">
          {/* User Info */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Account
            </Text>
            <View className="bg-gray-50 rounded-2xl p-4">
              <Text className="text-gray-900 font-medium">
                {user?.user_metadata?.full_name || "User"}
              </Text>
              <Text className="text-gray-400 text-sm">{user?.email}</Text>
            </View>
          </View>

          {/* Household Section */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Household
            </Text>
            
            {isLoadingHousehold ? (
              <View className="bg-gray-50 rounded-2xl p-6 items-center">
                <ActivityIndicator color="#EA4335" />
              </View>
            ) : household ? (
              // User is in a household
              <View className="bg-gray-50 rounded-2xl p-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-gray-900 font-semibold text-lg">
                      {household.name}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View className="bg-primary-100 px-3 py-1 rounded-full">
                    <Text className="text-primary-600 text-sm font-medium">
                      {members.find(m => m.user_id === user?.id)?.role === "owner" ? "Owner" : "Member"}
                    </Text>
                  </View>
                </View>

                {/* Invite Code */}
                <View className="bg-white rounded-xl p-3 mb-4">
                  <Text className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Invite Code
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 font-mono text-lg font-semibold tracking-widest">
                      {household.invite_code.toUpperCase()}
                    </Text>
                    <TouchableOpacity 
                      className="bg-primary-500 px-3 py-1.5 rounded-lg"
                      onPress={handleShareInviteCode}
                    >
                      <Text className="text-white text-sm font-medium">Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Members List */}
                <View className="mb-4">
                  <Text className="text-gray-500 text-sm mb-2">Members</Text>
                  {members.map((member, index) => (
                    <View 
                      key={member.id}
                      className={`flex-row items-center py-2 ${
                        index < members.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3">
                        <Text className="text-primary-500">👤</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800">
                          {member.user_id === user?.id ? "You" : `Member`}
                        </Text>
                      </View>
                      {member.role === "owner" && (
                        <Text className="text-gray-400 text-xs">Owner</Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* Leave Button */}
                <TouchableOpacity 
                  className="py-3 items-center"
                  onPress={handleLeaveHousehold}
                  disabled={leaveHousehold.isPending}
                >
                  {leaveHousehold.isPending ? (
                    <ActivityIndicator color="#EA4335" size="small" />
                  ) : (
                    <Text className="text-primary-500 font-medium">Leave Household</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // User not in a household
              <View>
                {!showCreateForm && !showJoinForm ? (
                  <View className="bg-gray-50 rounded-2xl p-6">
                    <Text className="text-gray-700 text-center mb-4">
                      Join or create a household to share recipes with family members.
                    </Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        className="flex-1 bg-primary-500 py-3 rounded-xl items-center"
                        onPress={() => setShowCreateForm(true)}
                      >
                        <Text className="text-white font-semibold">Create</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
                        onPress={() => setShowJoinForm(true)}
                      >
                        <Text className="text-gray-700 font-semibold">Join</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : showCreateForm ? (
                  <View className="bg-gray-50 rounded-2xl p-4">
                    <Text className="text-gray-900 font-semibold mb-3">Create Household</Text>
                    <TextInput
                      className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200 mb-3"
                      placeholder="Household name (e.g., Smith Family)"
                      value={householdName}
                      onChangeText={setHouseholdName}
                      placeholderTextColor="#9CA3AF"
                    />
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
                        onPress={() => {
                          setShowCreateForm(false);
                          setHouseholdName("");
                        }}
                      >
                        <Text className="text-gray-700 font-medium">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="flex-1 bg-primary-500 py-3 rounded-xl items-center"
                        onPress={handleCreateHousehold}
                        disabled={createHousehold.isPending}
                      >
                        {createHousehold.isPending ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text className="text-white font-semibold">Create</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="bg-gray-50 rounded-2xl p-4">
                    <Text className="text-gray-900 font-semibold mb-3">Join Household</Text>
                    <TextInput
                      className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200 mb-3 font-mono tracking-widest text-center text-lg"
                      placeholder="Enter invite code"
                      value={inviteCode}
                      onChangeText={setInviteCode}
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                      maxLength={8}
                    />
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
                        onPress={() => {
                          setShowJoinForm(false);
                          setInviteCode("");
                        }}
                      >
                        <Text className="text-gray-700 font-medium">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="flex-1 bg-primary-500 py-3 rounded-xl items-center"
                        onPress={handleJoinHousehold}
                        disabled={joinHousehold.isPending}
                      >
                        {joinHousehold.isPending ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text className="text-white font-semibold">Join</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
