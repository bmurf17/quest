/**
 * Database schema contract for the Supabase `public` schema.
 *
 * Regenerate after any schema change with:
 *
 *   pnpm db:types
 *
 * That command runs `supabase gen types typescript --linked` against the
 * linked project and overwrites this file. The checked-in copy is what the
 * app compiles against, so a stale copy is a type error rather than a runtime
 * surprise. Keep the shape compatible with the Supabase CLI output.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      camps: {
        Row: {
          id: number;
          heal_amount: number;
          restores_mana: boolean;
          cost: number | null;
          discovery_message: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["camps"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["camps"]["Row"]>;
        Relationships: [];
      };
      chests: {
        Row: {
          id: number;
          item_id: string;
          quantity: number;
          is_locked: boolean;
          is_open: boolean;
          discovery_message: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chests"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["chests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "chests_item_id_fkey";
            columns: ["item_id"];
            isOneRelation: true;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_flags: {
        Row: {
          id: string;
          player_id: string;
          npc_id: number | null;
          flag_key: string;
          flag_value: string | null;
          updated_at: string | null;
        };
        Insert: Partial<
          Database["public"]["Tables"]["conversation_flags"]["Row"]
        >;
        Update: Partial<
          Database["public"]["Tables"]["conversation_flags"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "conversation_flags_npc_id_fkey";
            columns: ["npc_id"];
            isOneRelation: true;
            referencedRelation: "npcs";
            referencedColumns: ["id"];
          },
        ];
      };
      dialogue_choices: {
        Row: {
          id: string;
          node_id: string;
          choice_text: string;
          next_node_id: string | null;
          required_skill: string | null;
          skill_check_dc: number | null;
          success_node_id: string | null;
          failure_node_id: string | null;
          sort_order: number;
        };
        Insert: Partial<
          Database["public"]["Tables"]["dialogue_choices"]["Row"]
        >;
        Update: Partial<
          Database["public"]["Tables"]["dialogue_choices"]["Row"]
        >;
        Relationships: [];
      };
      dialogue_nodes: {
        Row: {
          id: string;
          dialogue_id: string;
          npc_text: string;
          speaker: string;
          is_endpoint: number;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["dialogue_nodes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["dialogue_nodes"]["Row"]>;
        Relationships: [];
      };
      dialogue_outcomes: {
        Row: {
          id: string;
          node_id: string;
          choice_id: string | null;
          outcome_type: string;
          outcome_value: string | null;
          flag_key: string | null;
          flag_value: string | null;
        };
        Insert: Partial<
          Database["public"]["Tables"]["dialogue_outcomes"]["Row"]
        >;
        Update: Partial<
          Database["public"]["Tables"]["dialogue_outcomes"]["Row"]
        >;
        Relationships: [];
      };
      enemies: {
        Row: {
          id: number;
          name: string;
          created_at: string;
          health: number;
          strength: number;
          defense: number;
          dex: number;
          img: string;
          expGain: number | null;
          exp_gain: number;
          type: string;
          max_health: number | null;
          phase: number | null;
          phase_thresholds: Json | null;
          moves: Json | null;
          spawns: Json | null;
          gold_reward: number;
          reward_items: Json | null;
        };
        Insert: Partial<Database["public"]["Tables"]["enemies"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["enemies"]["Row"]>;
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          name: string;
          value: number;
          img: string;
          type: string;
          effect: string | null;
          hp_change: number | null;
          mana_change: number | null;
          stack_size: number | null;
          slot: string | null;
          attack: number | null;
          defense: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["items"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["items"]["Row"]>;
        Relationships: [];
      };
      neighboring_rooms: {
        Row: {
          id: number;
          room_id: number;
          neighbor_room_id: number;
          direction: Database["public"]["Enums"]["direction_enum"];
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["neighboring_rooms"]["Row"]
        >;
        Update: Partial<
          Database["public"]["Tables"]["neighboring_rooms"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "neighboring_rooms_room_id_fkey";
            columns: ["room_id"];
            isOneRelation: true;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "neighboring_rooms_neighbor_room_id_fkey";
            columns: ["neighbor_room_id"];
            isOneRelation: true;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      npc_dialogues: {
        Row: {
          id: string;
          npc_id: number | null;
          root_node_id: string;
          name: string;
          default_outcome: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["npc_dialogues"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["npc_dialogues"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "npc_dialogues_npc_id_fkey";
            columns: ["npc_id"];
            isOneRelation: true;
            referencedRelation: "npcs";
            referencedColumns: ["id"];
          },
        ];
      };
      npcs: {
        Row: {
          id: number;
          name: string;
          dialogue: string[];
          discovery_message: string | null;
          created_at: string;
          npc_type: string;
          img: string;
          disposition: string;
          quest_id: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["npcs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["npcs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "npcs_quest_id_fkey";
            columns: ["quest_id"];
            isOneRelation: true;
            referencedRelation: "quests";
            referencedColumns: ["id"];
          },
        ];
      };
      quest_objectives: {
        Row: {
          id: number;
          quest_id: number;
          position: number;
          objective: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["quest_objectives"]["Row"]
        >;
        Update: Partial<
          Database["public"]["Tables"]["quest_objectives"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "quest_objectives_quest_id_fkey";
            columns: ["quest_id"];
            isOneRelation: true;
            referencedRelation: "quests";
            referencedColumns: ["id"];
          },
        ];
      };
      quest_rewards: {
        Row: {
          quest_id: number;
          item_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quest_rewards"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["quest_rewards"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "quest_rewards_quest_id_fkey";
            columns: ["quest_id"];
            isOneRelation: true;
            referencedRelation: "quests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quest_rewards_item_id_fkey";
            columns: ["item_id"];
            isOneRelation: true;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      quests: {
        Row: {
          id: number;
          name: string;
          description: string;
          quest_type: string;
          fetch_item_id: string | null;
          defeat_enemy_id: number | null;
          explore_room_id: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["quests"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["quests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "quests_fetch_item_id_fkey";
            columns: ["fetch_item_id"];
            isOneRelation: true;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quests_defeat_enemy_id_fkey";
            columns: ["defeat_enemy_id"];
            isOneRelation: true;
            referencedRelation: "enemies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quests_explore_room_id_fkey";
            columns: ["explore_room_id"];
            isOneRelation: true;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      room_enemies: {
        Row: {
          id: number;
          room_id: number;
          enemy_id: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["room_enemies"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["room_enemies"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "room_enemies_room_id_fkey";
            columns: ["room_id"];
            isOneRelation: true;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_enemies_enemy_id_fkey";
            columns: ["enemy_id"];
            isOneRelation: true;
            referencedRelation: "enemies";
            referencedColumns: ["id"];
          },
        ];
      };
      room_interactions: {
        Row: {
          id: number;
          room_id: number;
          interaction_type: Database["public"]["Enums"]["interaction_type_enum"];
          npc_id: number | null;
          chest_id: number | null;
          camp_id: number | null;
          transition_id: number | null;
          cutscene_id: string | null;
          discovery_message: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["room_interactions"]["Row"]
        >;
        Update: Partial<
          Database["public"]["Tables"]["room_interactions"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "room_interactions_room_id_fkey";
            columns: ["room_id"];
            isOneRelation: true;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_interactions_npc_id_fkey";
            columns: ["npc_id"];
            isOneRelation: true;
            referencedRelation: "npcs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_interactions_chest_id_fkey";
            columns: ["chest_id"];
            isOneRelation: true;
            referencedRelation: "chests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_interactions_camp_id_fkey";
            columns: ["camp_id"];
            isOneRelation: true;
            referencedRelation: "camps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_interactions_transition_id_fkey";
            columns: ["transition_id"];
            isOneRelation: true;
            referencedRelation: "transitions";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          id: number;
          name: string;
          created_at: string;
          section_id: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "rooms_section_id_fkey";
            columns: ["section_id"];
            isOneRelation: true;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
        ];
      };
      sections: {
        Row: {
          id: number;
          name: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sections"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sections"]["Row"]>;
        Relationships: [];
      };
      shop_stock: {
        Row: {
          id: number;
          shop_key: string;
          item_id: string;
          quantity: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shop_stock"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["shop_stock"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "shop_stock_item_id_fkey";
            columns: ["item_id"];
            isOneRelation: true;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      transitions: {
        Row: {
          id: number;
          destination: string;
          discovery_message: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["transitions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["transitions"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      reset_content_sequences: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      direction_enum: "North" | "South" | "East" | "West";
      interaction_type_enum:
        | "NPC"
        | "chest"
        | "camp"
        | "transition"
        | "cutscene";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
