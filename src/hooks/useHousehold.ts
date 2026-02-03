import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  user_email?: string;
  user_name?: string;
}

// Fetch user's household (if any)
export function useHousehold() {
  return useQuery({
    queryKey: ["household"],
    queryFn: async (): Promise<Household | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get household membership
      const { data: membership, error: memberError } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (memberError || !membership) {
        return null; // User not in any household
      }

      // Get household details
      const { data: household, error: householdError } = await supabase
        .from("households")
        .select("*")
        .eq("id", membership.household_id)
        .single();

      if (householdError) throw householdError;
      return household;
    },
  });
}

// Fetch household members
export function useHouseholdMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: ["householdMembers", householdId],
    queryFn: async (): Promise<HouseholdMember[]> => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", householdId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!householdId,
  });
}

// Create a new household
export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string): Promise<Household> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is already in a household
      const { data: existingMembership } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingMembership) {
        throw new Error("You are already in a household. Leave it first to create a new one.");
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from("households")
        .insert({
          name,
          created_by: user.id,
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from("household_members")
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      return household;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
      queryClient.invalidateQueries({ queryKey: ["householdMembers"] });
    },
  });
}

// Join a household with invite code
export function useJoinHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string): Promise<Household> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is already in a household
      const { data: existingMembership } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingMembership) {
        throw new Error("You are already in a household. Leave it first to join another.");
      }

      // Find household by invite code
      const { data: household, error: findError } = await supabase
        .from("households")
        .select("*")
        .eq("invite_code", inviteCode.toLowerCase().trim())
        .single();

      if (findError || !household) {
        throw new Error("Invalid invite code. Please check and try again.");
      }

      // Join household
      const { error: joinError } = await supabase
        .from("household_members")
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: "member",
        });

      if (joinError) throw joinError;

      return household;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
      queryClient.invalidateQueries({ queryKey: ["householdMembers"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

// Leave household
export function useLeaveHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
      queryClient.invalidateQueries({ queryKey: ["householdMembers"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
