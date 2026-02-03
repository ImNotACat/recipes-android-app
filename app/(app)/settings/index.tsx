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
import { useTheme } from "../../../src/providers/ThemeProvider";
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
  const { theme, isDark, setTheme } = useTheme();
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
      <SafeAreaView 
        className="flex-1" 
        style={{ backgroundColor: isDark ? '#1F1D2B' : 'white' }}
        edges={["top"]}
      >
        {/* Header */}
        <View 
          className="flex-row items-center px-6 py-4 border-b"
          style={{ borderColor: isDark ? '#393C49' : '#F3F4F6' }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-lg" style={{ color: isDark ? '#ABBBC2' : '#111827' }}>←</Text>
          </TouchableOpacity>
          <Text 
            className="text-lg font-semibold ml-4"
            style={{ color: isDark ? '#FFFFFF' : '#111827' }}
          >
            Settings
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-6 py-6">
          {/* Appearance */}
          <View className="mb-8">
            <Text 
              className="text-sm font-medium uppercase tracking-wider mb-3"
              style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
            >
              Appearance
            </Text>
            <View 
              className="rounded-2xl p-4"
              style={{ backgroundColor: isDark ? '#252836' : '#F9FAFB' }}
            >
              <Text 
                className="font-medium mb-3"
                style={{ color: isDark ? '#FFFFFF' : '#111827' }}
              >
                Theme
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ 
                    backgroundColor: theme === 'light' 
                      ? (isDark ? '#EA7C69' : '#EA4335')
                      : (isDark ? '#393C49' : '#E5E7EB')
                  }}
                  onPress={() => setTheme('light')}
                >
                  <Text 
                    className="font-medium"
                    style={{ color: theme === 'light' ? '#FFFFFF' : (isDark ? '#ABBBC2' : '#6B7280') }}
                  >
                    ☀️ Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ 
                    backgroundColor: theme === 'dark' 
                      ? (isDark ? '#EA7C69' : '#EA4335')
                      : (isDark ? '#393C49' : '#E5E7EB')
                  }}
                  onPress={() => setTheme('dark')}
                >
                  <Text 
                    className="font-medium"
                    style={{ color: theme === 'dark' ? '#FFFFFF' : (isDark ? '#ABBBC2' : '#6B7280') }}
                  >
                    🌙 Dark
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ 
                    backgroundColor: theme === 'system' 
                      ? (isDark ? '#EA7C69' : '#EA4335')
                      : (isDark ? '#393C49' : '#E5E7EB')
                  }}
                  onPress={() => setTheme('system')}
                >
                  <Text 
                    className="font-medium"
                    style={{ color: theme === 'system' ? '#FFFFFF' : (isDark ? '#ABBBC2' : '#6B7280') }}
                  >
                    📱 Auto
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* User Info */}
          <View className="mb-8">
            <Text 
              className="text-sm font-medium uppercase tracking-wider mb-3"
              style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
            >
              Account
            </Text>
            <View 
              className="rounded-2xl p-4"
              style={{ backgroundColor: isDark ? '#252836' : '#F9FAFB' }}
            >
              <Text 
                className="font-medium"
                style={{ color: isDark ? '#FFFFFF' : '#111827' }}
              >
                {user?.user_metadata?.full_name || "User"}
              </Text>
              <Text style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }} className="text-sm">
                {user?.email}
              </Text>
            </View>
          </View>

          {/* Household Section */}
          <View className="mb-8">
            <Text 
              className="text-sm font-medium uppercase tracking-wider mb-3"
              style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
            >
              Household
            </Text>
            
            {isLoadingHousehold ? (
              <View 
                className="rounded-2xl p-6 items-center"
                style={{ backgroundColor: isDark ? '#252836' : '#F9FAFB' }}
              >
                <ActivityIndicator color={isDark ? '#EA7C69' : '#EA4335'} />
              </View>
            ) : household ? (
              // User is in a household
              <View 
                className="rounded-2xl p-4"
                style={{ backgroundColor: isDark ? '#252836' : '#F9FAFB' }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text 
                      className="font-semibold text-lg"
                      style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                    >
                      {household.name}
                    </Text>
                    <Text style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }} className="text-sm">
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View 
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: isDark ? 'rgba(234, 124, 105, 0.2)' : '#FEE2E2' }}
                  >
                    <Text 
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#EA7C69' : '#DC2626' }}
                    >
                      {members.find(m => m.user_id === user?.id)?.role === "owner" ? "Owner" : "Member"}
                    </Text>
                  </View>
                </View>

                {/* Invite Code */}
                <View 
                  className="rounded-xl p-3 mb-4"
                  style={{ backgroundColor: isDark ? '#1F1D2B' : 'white' }}
                >
                  <Text 
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
                  >
                    Invite Code
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text 
                      className="font-mono text-lg font-semibold tracking-widest"
                      style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                    >
                      {household.invite_code.toUpperCase()}
                    </Text>
                    <TouchableOpacity 
                      className="px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: isDark ? '#EA7C69' : '#EA4335' }}
                      onPress={handleShareInviteCode}
                    >
                      <Text className="text-white text-sm font-medium">Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Members List */}
                <View className="mb-4">
                  <Text 
                    className="text-sm mb-2"
                    style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}
                  >
                    Members
                  </Text>
                  {members.map((member, index) => (
                    <View 
                      key={member.id}
                      className="flex-row items-center py-2"
                      style={{ 
                        borderBottomWidth: index < members.length - 1 ? 1 : 0,
                        borderColor: isDark ? '#393C49' : '#F3F4F6'
                      }}
                    >
                      <View 
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: isDark ? 'rgba(234, 124, 105, 0.2)' : '#FEE2E2' }}
                      >
                        <Text>👤</Text>
                      </View>
                      <View className="flex-1">
                        <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}>
                          {member.user_id === user?.id ? "You" : `Member`}
                        </Text>
                      </View>
                      {member.role === "owner" && (
                        <Text 
                          className="text-xs"
                          style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
                        >
                          Owner
                        </Text>
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
                    <ActivityIndicator color={isDark ? '#EA7C69' : '#EA4335'} size="small" />
                  ) : (
                    <Text 
                      className="font-medium"
                      style={{ color: isDark ? '#EA7C69' : '#EA4335' }}
                    >
                      Leave Household
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // User not in a household
              <View>
                {!showCreateForm && !showJoinForm ? (
                  <View 
                    className="rounded-2xl p-6"
                    style={{ backgroundColor: isDark ? '#252836' : '#F9FAFB' }}
                  >
                    <Text 
                      className="text-center mb-4"
                      style={{ color: isDark ? '#ABBBC2' : '#374151' }}
                    >
                      Join or create a household to share recipes with family members.
                    </Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{ backgroundColor: isDark ? '#EA7C69' : '#EA4335' }}
                        onPress={() => setShowCreateForm(true)}
                      >
                        <Text className="text-white font-semibold">Create</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{ backgroundColor: isDark ? '#393C49' : '#E5E7EB' }}
                        onPress={() => setShowJoinForm(true)}
                      >
                        <Text 
                          className="font-semibold"
                          style={{ color: isDark ? '#ABBBC2' : '#374151' }}
                        >
                          Join
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : showCreateForm ? (
                  <View 
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: isDark ? '#252836' : '#F9FAFB' }}
                  >
                    <Text 
                      className="font-semibold mb-3"
                      style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                    >
                      Create Household
                    </Text>
                    <TextInput
                      className="rounded-xl px-4 py-3 mb-3"
                      style={{ 
                        backgroundColor: isDark ? '#1F1D2B' : 'white',
                        borderWidth: 1,
                        borderColor: isDark ? '#393C49' : '#E5E7EB',
                        color: isDark ? '#FFFFFF' : '#111827'
                      }}
                      placeholder="Household name (e.g., Smith Family)"
                      value={householdName}
                      onChangeText={setHouseholdName}
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    />
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{ backgroundColor: isDark ? '#393C49' : '#E5E7EB' }}
                        onPress={() => {
                          setShowCreateForm(false);
                          setHouseholdName("");
                        }}
                      >
                        <Text 
                          className="font-medium"
                          style={{ color: isDark ? '#ABBBC2' : '#374151' }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{ backgroundColor: isDark ? '#EA7C69' : '#EA4335' }}
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
                  <View 
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: isDark ? '#252836' : '#F9FAFB' }}
                  >
                    <Text 
                      className="font-semibold mb-3"
                      style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                    >
                      Join Household
                    </Text>
                    <TextInput
                      className="rounded-xl px-4 py-3 mb-3 font-mono tracking-widest text-center text-lg"
                      style={{ 
                        backgroundColor: isDark ? '#1F1D2B' : 'white',
                        borderWidth: 1,
                        borderColor: isDark ? '#393C49' : '#E5E7EB',
                        color: isDark ? '#FFFFFF' : '#111827'
                      }}
                      placeholder="Enter invite code"
                      value={inviteCode}
                      onChangeText={setInviteCode}
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      autoCapitalize="characters"
                      maxLength={8}
                    />
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{ backgroundColor: isDark ? '#393C49' : '#E5E7EB' }}
                        onPress={() => {
                          setShowJoinForm(false);
                          setInviteCode("");
                        }}
                      >
                        <Text 
                          className="font-medium"
                          style={{ color: isDark ? '#ABBBC2' : '#374151' }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{ backgroundColor: isDark ? '#EA7C69' : '#EA4335' }}
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
