export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      actividades: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          institution_id: string | null
          name: string | null
          proceso_id: string | null
          tramite_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          institution_id?: string | null
          name?: string | null
          proceso_id?: string | null
          tramite_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          institution_id?: string | null
          name?: string | null
          proceso_id?: string | null
          tramite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actividades_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string | null
          province_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          province_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          province_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          address: string | null
          assigned_to: string | null
          client_type: string | null
          created_at: string
          email: string | null
          id: string
          last_activity: string | null
          last_update: string | null
          name: string | null
          next_activity: string | null
          notes: string | null
          phone_number: string | null
          photo: string | null
          potential_value: number | null
          registered_by_id: string | null
          registered_by_name: string | null
          status: string | null
          tags: string[] | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          client_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_activity?: string | null
          last_update?: string | null
          name?: string | null
          next_activity?: string | null
          notes?: string | null
          phone_number?: string | null
          photo?: string | null
          potential_value?: number | null
          registered_by_id?: string | null
          registered_by_name?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          client_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_activity?: string | null
          last_update?: string | null
          name?: string | null
          next_activity?: string | null
          notes?: string | null
          phone_number?: string | null
          photo?: string | null
          potential_value?: number | null
          registered_by_id?: string | null
          registered_by_name?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_registered_by_id_fkey"
            columns: ["registered_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          department_name: string | null
          director_id: string | null
          icon: string | null
          icon_dark: string | null
          id: string
          institution_id: string | null
          seleccion_temp: boolean | null
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          department_name?: string | null
          director_id?: string | null
          icon?: string | null
          icon_dark?: string | null
          id?: string
          institution_id?: string | null
          seleccion_temp?: boolean | null
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          department_name?: string | null
          director_id?: string | null
          icon?: string | null
          icon_dark?: string | null
          id?: string
          institution_id?: string | null
          seleccion_temp?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution"
            referencedColumns: ["id"]
          },
        ]
      }
      file_upload_inf: {
        Row: {
          created_at: string
          download_url: string | null
          file_extension: string | null
          file_name: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          file_extension?: string | null
          file_name?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          download_url?: string | null
          file_extension?: string | null
          file_name?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_upload_inf_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      institution: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo: string | null
          mision: string | null
          name: string | null
          phone_number: string | null
          valores: string[] | null
          vision: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          mision?: string | null
          name?: string | null
          phone_number?: string | null
          valores?: string[] | null
          vision?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          mision?: string | null
          name?: string | null
          phone_number?: string | null
          valores?: string[] | null
          vision?: string | null
          website?: string | null
        }
        Relationships: []
      }
      permisos: {
        Row: {
          create: boolean | null
          created_at: string
          delete: boolean | null
          id: string
          read: boolean | null
          rol_name: string | null
          section: string | null
          update: boolean | null
        }
        Insert: {
          create?: boolean | null
          created_at?: string
          delete?: boolean | null
          id?: string
          read?: boolean | null
          rol_name?: string | null
          section?: string | null
          update?: boolean | null
        }
        Update: {
          create?: boolean | null
          created_at?: string
          delete?: boolean | null
          id?: string
          read?: boolean | null
          rol_name?: string | null
          section?: string | null
          update?: boolean | null
        }
        Relationships: []
      }
      procesos: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          institution_id: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          institution_id?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          institution_id?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      tramites: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          institution_id: string | null
          name: string | null
          proceso_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          institution_id?: string | null
          name?: string | null
          proceso_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          institution_id?: string | null
          name?: string | null
          proceso_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tramites_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramites_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramites_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          department_id: string | null
          display_name: string | null
          email: string | null
          enable: boolean | null
          first_login: boolean | null
          id: string
          institution_id: string | null
          phone_number: string | null
          photo_url: string | null
          rol_name: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          email?: string | null
          enable?: boolean | null
          first_login?: boolean | null
          id: string
          institution_id?: string | null
          phone_number?: string | null
          photo_url?: string | null
          rol_name?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          email?: string | null
          enable?: boolean | null
          first_login?: boolean | null
          id?: string
          institution_id?: string | null
          phone_number?: string | null
          photo_url?: string | null
          rol_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
