export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accion: string
          actor: string
          actor_id: string | null
          detalle: string
          entidad: string
          fecha: string
          id: string
          rol: string
        }
        Insert: {
          accion: string
          actor: string
          actor_id?: string | null
          detalle?: string
          entidad: string
          fecha?: string
          id?: string
          rol: string
        }
        Update: {
          accion?: string
          actor?: string
          actor_id?: string | null
          detalle?: string
          entidad?: string
          fecha?: string
          id?: string
          rol?: string
        }
        Relationships: []
      }
      biometria: {
        Row: {
          estado: string
          fecha_actualizacion: string
          fecha_registro: string
          id: string
          residente_id: string
          tipo: string
        }
        Insert: {
          estado: string
          fecha_actualizacion?: string
          fecha_registro?: string
          id?: string
          residente_id: string
          tipo: string
        }
        Update: {
          estado?: string
          fecha_actualizacion?: string
          fecha_registro?: string
          id?: string
          residente_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "biometria_residente_id_fkey"
            columns: ["residente_id"]
            isOneToOne: false
            referencedRelation: "residentes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispositivos: {
        Row: {
          created_at: string
          estado: string
          id: string
          identificador: string
          nombre: string
          tipo: string
          ubicacion: string
          ultima_conexion: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          identificador?: string
          nombre: string
          tipo: string
          ubicacion?: string
          ultima_conexion?: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          identificador?: string
          nombre?: string
          tipo?: string
          ubicacion?: string
          ultima_conexion?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          created_at: string
          dispositivo_id: string | null
          fecha: string
          hora: string
          id: string
          metodo: string
          motivo: string
          origen: string | null
          persona: string
          resultado: string
          vivienda_id: string | null
        }
        Insert: {
          created_at?: string
          dispositivo_id?: string | null
          fecha: string
          hora: string
          id?: string
          metodo: string
          motivo?: string
          origen?: string | null
          persona: string
          resultado: string
          vivienda_id?: string | null
        }
        Update: {
          created_at?: string
          dispositivo_id?: string | null
          fecha?: string
          hora?: string
          id?: string
          metodo?: string
          motivo?: string
          origen?: string | null
          persona?: string
          resultado?: string
          vivienda_id?: string | null
        }
        Relationships: []
      }
      invitados: {
        Row: {
          anfitrion_id: string
          apellido: string
          created_at: string
          documento: string
          estado: string
          fin: string
          id: string
          inicio: string
          nombre: string
          vivienda_id: string | null
        }
        Insert: {
          anfitrion_id: string
          apellido: string
          created_at?: string
          documento?: string
          estado?: string
          fin: string
          id?: string
          inicio: string
          nombre: string
          vivienda_id?: string | null
        }
        Update: {
          anfitrion_id?: string
          apellido?: string
          created_at?: string
          documento?: string
          estado?: string
          fin?: string
          id?: string
          inicio?: string
          nombre?: string
          vivienda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitados_anfitrion_id_fkey"
            columns: ["anfitrion_id"]
            isOneToOne: false
            referencedRelation: "residentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitados_vivienda_id_fkey"
            columns: ["vivienda_id"]
            isOneToOne: false
            referencedRelation: "viviendas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          fecha: string
          id: string
          leida: boolean
          mensaje: string
          residente_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          fecha?: string
          id?: string
          leida?: boolean
          mensaje: string
          residente_id: string
          tipo: string
          titulo: string
        }
        Update: {
          fecha?: string
          id?: string
          leida?: boolean
          mensaje?: string
          residente_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string
          correo: string
          created_at: string
          documento: string
          estado: string
          id: string
          nombre: string
          telefono: string
          vivienda_solicitada: string
        }
        Insert: {
          apellido?: string
          correo?: string
          created_at?: string
          documento?: string
          estado?: string
          id: string
          nombre?: string
          telefono?: string
          vivienda_solicitada?: string
        }
        Update: {
          apellido?: string
          correo?: string
          created_at?: string
          documento?: string
          estado?: string
          id?: string
          nombre?: string
          telefono?: string
          vivienda_solicitada?: string
        }
        Relationships: []
      }
      residentes: {
        Row: {
          apellido: string
          correo: string
          created_at: string
          documento: string
          estado: string
          fecha_registro: string
          id: string
          nombre: string
          telefono: string
          user_id: string | null
          vivienda_id: string | null
        }
        Insert: {
          apellido: string
          correo?: string
          created_at?: string
          documento?: string
          estado?: string
          fecha_registro?: string
          id?: string
          nombre: string
          telefono?: string
          user_id?: string | null
          vivienda_id?: string | null
        }
        Update: {
          apellido?: string
          correo?: string
          created_at?: string
          documento?: string
          estado?: string
          fecha_registro?: string
          id?: string
          nombre?: string
          telefono?: string
          user_id?: string | null
          vivienda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residentes_vivienda_id_fkey"
            columns: ["vivienda_id"]
            isOneToOne: false
            referencedRelation: "viviendas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viviendas: {
        Row: {
          codigo: string
          created_at: string
          estado: string
          id: string
          piso: number
          residente_principal: string | null
          torre: string
        }
        Insert: {
          codigo: string
          created_at?: string
          estado?: string
          id?: string
          piso?: number
          residente_principal?: string | null
          torre?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          estado?: string
          id?: string
          piso?: number
          residente_principal?: string | null
          torre?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprobar_usuario: {
        Args: { _user_id: string; _vivienda_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mi_residente_id: { Args: never; Returns: string }
      mi_vivienda_id: { Args: never; Returns: string }
      rechazar_usuario: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "residente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "residente"],
    },
  },
} as const
