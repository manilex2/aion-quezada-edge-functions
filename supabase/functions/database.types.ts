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
          activity_name: string | null
          caso_id: string | null
          client_id: string | null
          close: boolean | null
          created_at: string
          end_date_planned: string | null
          end_date_real: string | null
          id: string
          last_status: string | null
          order: number | null
          register_by_email: string | null
          register_by_id: string | null
          responsible_id: string | null
          start_date: string | null
          start_date_planned: string | null
          termino: number | null
          tramite_id: string | null
        }
        Insert: {
          activity_name?: string | null
          caso_id?: string | null
          client_id?: string | null
          close?: boolean | null
          created_at?: string
          end_date_planned?: string | null
          end_date_real?: string | null
          id?: string
          last_status?: string | null
          order?: number | null
          register_by_email?: string | null
          register_by_id?: string | null
          responsible_id?: string | null
          start_date?: string | null
          start_date_planned?: string | null
          termino?: number | null
          tramite_id?: string | null
        }
        Update: {
          activity_name?: string | null
          caso_id?: string | null
          client_id?: string | null
          close?: boolean | null
          created_at?: string
          end_date_planned?: string | null
          end_date_real?: string | null
          id?: string
          last_status?: string | null
          order?: number | null
          register_by_email?: string | null
          register_by_id?: string | null
          responsible_id?: string | null
          start_date?: string | null
          start_date_planned?: string | null
          termino?: number | null
          tramite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acciones__caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "client_tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      actividades_avances: {
        Row: {
          activity_id: string | null
          close: boolean | null
          comment: string | null
          created_at: string
          end_date_planned: string | null
          end_date_real: string | null
          end_date_reschedule: string | null
          id: string
          previous_responsible_id: string | null
          register_by_email: string | null
          register_by_id: string | null
          responsible_id: string | null
          status: string | null
        }
        Insert: {
          activity_id?: string | null
          close?: boolean | null
          comment?: string | null
          created_at?: string
          end_date_planned?: string | null
          end_date_real?: string | null
          end_date_reschedule?: string | null
          id?: string
          previous_responsible_id?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          responsible_id?: string | null
          status?: string | null
        }
        Update: {
          activity_id?: string | null
          close?: boolean | null
          comment?: string | null
          created_at?: string
          end_date_planned?: string | null
          end_date_real?: string | null
          end_date_reschedule?: string | null
          id?: string
          previous_responsible_id?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          responsible_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acciones_avances_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_avances_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_avances_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
        ]
      }
      actividades_avances_soportes: {
        Row: {
          activity_id: string | null
          avance_id: string | null
          caso_id: string | null
          client_id: string | null
          created_at: string
          file_name: string | null
          file_path: string | null
          file_type: string | null
          file_url: string | null
          id: string
          register_by_email: string | null
          register_by_id: string | null
          tramite_id: string | null
        }
        Insert: {
          activity_id?: string | null
          avance_id?: string | null
          caso_id?: string | null
          client_id?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          register_by_email?: string | null
          register_by_id?: string | null
          tramite_id?: string | null
        }
        Update: {
          activity_id?: string | null
          avance_id?: string | null
          caso_id?: string | null
          client_id?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          register_by_email?: string | null
          register_by_id?: string | null
          tramite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acciones_avances_soportes_avance_id_fkey"
            columns: ["avance_id"]
            isOneToOne: false
            referencedRelation: "actividades_avances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_avances_soportes_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_avances_soportes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_avances_soportes_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_avances_soportes_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "client_tramites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_avances_soportes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
        ]
      }
      actividades_dependencies: {
        Row: {
          created_at: string
          current_activity: string | null
          id: string
          prev_activity: string | null
        }
        Insert: {
          created_at?: string
          current_activity?: string | null
          id?: string
          prev_activity?: string | null
        }
        Update: {
          created_at?: string
          current_activity?: string | null
          id?: string
          prev_activity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actividades_dependencies_current_activity_fkey"
            columns: ["current_activity"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_dependencies_prev_activity_fkey"
            columns: ["prev_activity"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
        ]
      }
      caja_chica_liq_client: {
        Row: {
          bill_support: string | null
          caso_id: string
          client_id: string
          client_liq_code: string
          created_at: string
          id: string
          max_payment_day: string | null
          payment_support: string | null
          pdf_url: string | null
          user_id_liquidator: string
          value: number
        }
        Insert: {
          bill_support?: string | null
          caso_id: string
          client_id: string
          client_liq_code: string
          created_at?: string
          id?: string
          max_payment_day?: string | null
          payment_support?: string | null
          pdf_url?: string | null
          user_id_liquidator: string
          value: number
        }
        Update: {
          bill_support?: string | null
          caso_id?: string
          client_id?: string
          client_liq_code?: string
          created_at?: string
          id?: string
          max_payment_day?: string | null
          payment_support?: string | null
          pdf_url?: string | null
          user_id_liquidator?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "caja_chica_liq_client_user_id_liquidator_fkey"
            columns: ["user_id_liquidator"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidation_client_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidation_client_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
        ]
      }
      caja_chica_liq_internal: {
        Row: {
          created_at: string
          final_balance: number
          id: string
          initial_balance: number
          int_liq_code: string
          liquidation_value: number
          payment_date: string | null
          payment_support: string | null
          pdf_url: string | null
          refund: number
          user_id: string | null
          user_id_liquidator: string
        }
        Insert: {
          created_at?: string
          final_balance?: number
          id?: string
          initial_balance?: number
          int_liq_code: string
          liquidation_value?: number
          payment_date?: string | null
          payment_support?: string | null
          pdf_url?: string | null
          refund?: number
          user_id?: string | null
          user_id_liquidator: string
        }
        Update: {
          created_at?: string
          final_balance?: number
          id?: string
          initial_balance?: number
          int_liq_code?: string
          liquidation_value?: number
          payment_date?: string | null
          payment_support?: string | null
          pdf_url?: string | null
          refund?: number
          user_id?: string | null
          user_id_liquidator?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_liquidation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_liquidation_user_id_liquidator_fkey"
            columns: ["user_id_liquidator"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      caja_chica_reg_detail: {
        Row: {
          caja_chica_id: string
          created_at: string
          details: string
          id: string
          register_by_id: string
        }
        Insert: {
          caja_chica_id: string
          created_at?: string
          details: string
          id?: string
          register_by_id?: string
        }
        Update: {
          caja_chica_id?: string
          created_at?: string
          details?: string
          id?: string
          register_by_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caja_chica_reg_detail_caja_chica_id_fkey"
            columns: ["caja_chica_id"]
            isOneToOne: false
            referencedRelation: "caja_chica_registros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_chica_reg_detail_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      caja_chica_registros: {
        Row: {
          caso_id: string
          client_id: string
          client_liquidation: boolean
          client_liquidation_id: string | null
          concept: string
          created_at: string
          date: string
          id: string
          internal_liquidation: boolean
          internal_liquidation_id: string | null
          register_by_email: string
          register_by_id: string
          value: number
        }
        Insert: {
          caso_id: string
          client_id: string
          client_liquidation?: boolean
          client_liquidation_id?: string | null
          concept: string
          created_at?: string
          date: string
          id?: string
          internal_liquidation?: boolean
          internal_liquidation_id?: string | null
          register_by_email: string
          register_by_id?: string
          value: number
        }
        Update: {
          caso_id?: string
          client_id?: string
          client_liquidation?: boolean
          client_liquidation_id?: string | null
          concept?: string
          created_at?: string
          date?: string
          id?: string
          internal_liquidation?: boolean
          internal_liquidation_id?: string | null
          register_by_email?: string
          register_by_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "caja_chica_registros_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_chica_registros_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_chica_registros_client_liquidation_id_fkey"
            columns: ["client_liquidation_id"]
            isOneToOne: false
            referencedRelation: "caja_chica_liq_client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_chica_registros_internal_liquidation_id_fkey"
            columns: ["internal_liquidation_id"]
            isOneToOne: false
            referencedRelation: "caja_chica_liq_internal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_chica_registros_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      caja_chica_saldos: {
        Row: {
          available_balance: number | null
          created_at: string
          id: string
          pending_liquidation: number | null
          user_id: string | null
        }
        Insert: {
          available_balance?: number | null
          created_at?: string
          id?: string
          pending_liquidation?: number | null
          user_id?: string | null
        }
        Update: {
          available_balance?: number | null
          created_at?: string
          id?: string
          pending_liquidation?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caja_chica_saldos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      caja_chica_soportes: {
        Row: {
          caja_chica_id: string
          caso_id: string
          client_id: string
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          register_by_email: string
          register_by_id: string
        }
        Insert: {
          caja_chica_id: string
          caso_id: string
          client_id: string
          created_at?: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          register_by_email: string
          register_by_id?: string
        }
        Update: {
          caja_chica_id?: string
          caso_id?: string
          client_id?: string
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          register_by_email?: string
          register_by_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caja_chica_soportes_caja_chica_id_fkey"
            columns: ["caja_chica_id"]
            isOneToOne: false
            referencedRelation: "caja_chica_registros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_chica_soportes_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_chica_soportes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_chica_soportes_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      client: {
        Row: {
          assigned_to: string | null
          client_address: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_type: string | null
          created_at: string
          discount: boolean | null
          enable: boolean | null
          hour_payment: boolean | null
          id: string
          id_number: string | null
          id_type: string | null
          last_update: string | null
          logo: string | null
          monthly_value: number | null
          registered_by_email: string | null
          registered_by_id: string | null
          sector: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_type?: string | null
          created_at?: string
          discount?: boolean | null
          enable?: boolean | null
          hour_payment?: boolean | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_update?: string | null
          logo?: string | null
          monthly_value?: number | null
          registered_by_email?: string | null
          registered_by_id?: string | null
          sector?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_type?: string | null
          created_at?: string
          discount?: boolean | null
          enable?: boolean | null
          hour_payment?: boolean | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_update?: string | null
          logo?: string | null
          monthly_value?: number | null
          registered_by_email?: string | null
          registered_by_id?: string | null
          sector?: string | null
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
      client_casos: {
        Row: {
          case_name: string | null
          client_id: string | null
          close: boolean | null
          created_at: string
          end_date_planned: string | null
          end_date_real: string | null
          id: string
          materia_id: string | null
          process_id: string | null
          register_by_id: string | null
          registre_by_email: string | null
          responsible_id: string | null
          star_date: string | null
          start_date_planned: string | null
          termino: number | null
        }
        Insert: {
          case_name?: string | null
          client_id?: string | null
          close?: boolean | null
          created_at?: string
          end_date_planned?: string | null
          end_date_real?: string | null
          id?: string
          materia_id?: string | null
          process_id?: string | null
          register_by_id?: string | null
          registre_by_email?: string | null
          responsible_id?: string | null
          star_date?: string | null
          start_date_planned?: string | null
          termino?: number | null
        }
        Update: {
          case_name?: string | null
          client_id?: string | null
          close?: boolean | null
          created_at?: string
          end_date_planned?: string | null
          end_date_real?: string | null
          id?: string
          materia_id?: string | null
          process_id?: string | null
          register_by_id?: string | null
          registre_by_email?: string | null
          responsible_id?: string | null
          star_date?: string | null
          start_date_planned?: string | null
          termino?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "casos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_casos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_casos_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tramites: {
        Row: {
          caso_id: string | null
          client_id: string | null
          close: boolean | null
          created_at: string
          department_id: string | null
          end_date_planned: string | null
          end_date_real: string | null
          id: string
          institution_id: string | null
          order: number | null
          prev_tramite_id: string | null
          register_by_email: string | null
          register_by_id: string | null
          responsible_id: string | null
          start_date: string | null
          start_date_planned: string | null
          termino: number | null
          tramite_name: string | null
        }
        Insert: {
          caso_id?: string | null
          client_id?: string | null
          close?: boolean | null
          created_at?: string
          department_id?: string | null
          end_date_planned?: string | null
          end_date_real?: string | null
          id?: string
          institution_id?: string | null
          order?: number | null
          prev_tramite_id?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          responsible_id?: string | null
          start_date?: string | null
          start_date_planned?: string | null
          termino?: number | null
          tramite_name?: string | null
        }
        Update: {
          caso_id?: string | null
          client_id?: string | null
          close?: boolean | null
          created_at?: string
          department_id?: string | null
          end_date_planned?: string | null
          end_date_real?: string | null
          id?: string
          institution_id?: string | null
          order?: number | null
          prev_tramite_id?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          responsible_id?: string | null
          start_date?: string | null
          start_date_planned?: string | null
          termino?: number | null
          tramite_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_tramites_prev_tramite_id_fkey"
            columns: ["prev_tramite_id"]
            isOneToOne: false
            referencedRelation: "client_tramites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramites_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramites_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
            foreignKeyName: "tramites_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramites_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          code: string | null
          color: string | null
          company_name: string | null
          created_at: string
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
          company_name?: string | null
          created_at?: string
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
          company_name?: string | null
          created_at?: string
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
      habilitantes: {
        Row: {
          client_id: string | null
          created_at: string
          exp_date: string | null
          file_path: string | null
          file_type: string | null
          file_url: string | null
          habilitantes_name: string | null
          id: string
          register_by_email: string | null
          register_by_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          exp_date?: string | null
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          habilitantes_name?: string | null
          id?: string
          register_by_email?: string | null
          register_by_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          exp_date?: string | null
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          habilitantes_name?: string | null
          id?: string
          register_by_email?: string | null
          register_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habilitantes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habilitantes_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          holiday: string | null
          id: string
          original_date: string | null
          real_date: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          holiday?: string | null
          id?: string
          original_date?: string | null
          real_date?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          holiday?: string | null
          id?: string
          original_date?: string | null
          real_date?: string | null
          year?: number | null
        }
        Relationships: []
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
      lena_ai_chats: {
        Row: {
          created_at: string
          id: string
          message_received: string | null
          message_sent: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_received?: string | null
          message_sent?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_received?: string | null
          message_sent?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lena_ai_chats_threat_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "lena_ai_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lena_ai_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lena_ai_threads: {
        Row: {
          created_at: string
          id: string
          thread_detail: string | null
          thread_id_oai: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          thread_detail?: string | null
          thread_id_oai?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          thread_detail?: string | null
          thread_id_oai?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lena_ai_threats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      materia: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          materia_name: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          materia_name?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          materia_name?: string | null
        }
        Relationships: []
      }
      my_notes: {
        Row: {
          color_code: string | null
          created_at: string
          id: string
          note_text: string | null
          user_id: string | null
        }
        Insert: {
          color_code?: string | null
          created_at?: string
          id?: string
          note_text?: string | null
          user_id?: string | null
        }
        Update: {
          color_code?: string | null
          created_at?: string
          id?: string
          note_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "my_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_email: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string | null
          related_id: string | null
          sent: boolean | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string | null
          related_id?: string | null
          sent?: boolean | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string | null
          related_id?: string | null
          sent?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_email_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_push: {
        Row: {
          category: string | null
          created_at: string
          email: boolean | null
          id: string
          new: boolean | null
          notification_text: string | null
          notification_title: string | null
          read: boolean | null
          related_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: boolean | null
          id?: string
          new?: boolean | null
          notification_text?: string | null
          notification_title?: string | null
          read?: boolean | null
          related_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: boolean | null
          id?: string
          new?: boolean | null
          notification_text?: string | null
          notification_title?: string | null
          read?: boolean | null
          related_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_push_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      process: {
        Row: {
          activities_quantity: number | null
          consultant: boolean | null
          created_at: string
          enable: boolean | null
          id: string
          materia_id: string | null
          process_detail: string | null
          process_name: string | null
          tramites_quantity: number | null
        }
        Insert: {
          activities_quantity?: number | null
          consultant?: boolean | null
          created_at?: string
          enable?: boolean | null
          id?: string
          materia_id?: string | null
          process_detail?: string | null
          process_name?: string | null
          tramites_quantity?: number | null
        }
        Update: {
          activities_quantity?: number | null
          consultant?: boolean | null
          created_at?: string
          enable?: boolean | null
          id?: string
          materia_id?: string | null
          process_detail?: string | null
          process_name?: string | null
          tramites_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materia"
            referencedColumns: ["id"]
          },
        ]
      }
      process_activities: {
        Row: {
          activity_detail: string | null
          activity_order: number | null
          consultant: boolean | null
          created_at: string
          id: string
          prev_activity_id: string | null
          process_activity_name: string | null
          process_activity_term: number | null
          process_id: string | null
          process_tramite_id: string | null
        }
        Insert: {
          activity_detail?: string | null
          activity_order?: number | null
          consultant?: boolean | null
          created_at?: string
          id?: string
          prev_activity_id?: string | null
          process_activity_name?: string | null
          process_activity_term?: number | null
          process_id?: string | null
          process_tramite_id?: string | null
        }
        Update: {
          activity_detail?: string | null
          activity_order?: number | null
          consultant?: boolean | null
          created_at?: string
          id?: string
          prev_activity_id?: string | null
          process_activity_name?: string | null
          process_activity_term?: number | null
          process_id?: string | null
          process_tramite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_activities_prev_activity_id_fkey"
            columns: ["prev_activity_id"]
            isOneToOne: false
            referencedRelation: "process_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_activities_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_activities_process_tramite_id_fkey"
            columns: ["process_tramite_id"]
            isOneToOne: false
            referencedRelation: "process_tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      process_activities_dependencies: {
        Row: {
          created_at: string
          current_activity_id: string | null
          id: string
          prev_activity_id: string | null
          process_id: string | null
          process_tramite_id: string | null
        }
        Insert: {
          created_at?: string
          current_activity_id?: string | null
          id?: string
          prev_activity_id?: string | null
          process_id?: string | null
          process_tramite_id?: string | null
        }
        Update: {
          created_at?: string
          current_activity_id?: string | null
          id?: string
          prev_activity_id?: string | null
          process_id?: string | null
          process_tramite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_activities_dependencies_current_activity_id_fkey"
            columns: ["current_activity_id"]
            isOneToOne: false
            referencedRelation: "process_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_activities_dependencies_prev_activity_id_fkey"
            columns: ["prev_activity_id"]
            isOneToOne: false
            referencedRelation: "process_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_activities_dependencies_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_activities_dependencies_process_tramite_id_fkey"
            columns: ["process_tramite_id"]
            isOneToOne: false
            referencedRelation: "process_tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      process_tramites: {
        Row: {
          consultant: boolean | null
          created_at: string
          id: string
          prev_tramite_id: string | null
          process_id: string | null
          process_tramite_name: string | null
          process_tramite_term: number | null
          tramite_detail: string | null
          tramite_order: number | null
        }
        Insert: {
          consultant?: boolean | null
          created_at?: string
          id?: string
          prev_tramite_id?: string | null
          process_id?: string | null
          process_tramite_name?: string | null
          process_tramite_term?: number | null
          tramite_detail?: string | null
          tramite_order?: number | null
        }
        Update: {
          consultant?: boolean | null
          created_at?: string
          id?: string
          prev_tramite_id?: string | null
          process_id?: string | null
          process_tramite_name?: string | null
          process_tramite_term?: number | null
          tramite_detail?: string | null
          tramite_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_tramites_prev_tramite_id_fkey"
            columns: ["prev_tramite_id"]
            isOneToOne: false
            referencedRelation: "process_tramites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_tramites_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
            referencedColumns: ["id"]
          },
        ]
      }
      process_tramites_dependencies: {
        Row: {
          created_at: string
          current_tramite_id: string | null
          id: string
          previus_tramite_id: string | null
          process_id: string | null
        }
        Insert: {
          created_at?: string
          current_tramite_id?: string | null
          id?: string
          previus_tramite_id?: string | null
          process_id?: string | null
        }
        Update: {
          created_at?: string
          current_tramite_id?: string | null
          id?: string
          previus_tramite_id?: string | null
          process_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_ tramites_dependencies_current_tramite_id_fkey"
            columns: ["current_tramite_id"]
            isOneToOne: false
            referencedRelation: "process_tramites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_ tramites_dependencies_previus_tramite_id_fkey"
            columns: ["previus_tramite_id"]
            isOneToOne: false
            referencedRelation: "process_tramites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_tramites_dependencies_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process"
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
      reg_facturable: {
        Row: {
          activity: string | null
          activity_id: string | null
          caso_id: string | null
          client_id: string | null
          created_at: string
          details: string | null
          duration_real: number | null
          duration_to_bill: number | null
          end_date_time: string | null
          hour_value: number | null
          id: string
          is_liquidated: boolean
          reg_facturable_liq_id: string | null
          register_by_email: string | null
          register_by_id: string | null
          start_date_time: string | null
          total_value: number | null
          tramite_id: string | null
        }
        Insert: {
          activity?: string | null
          activity_id?: string | null
          caso_id?: string | null
          client_id?: string | null
          created_at?: string
          details?: string | null
          duration_real?: number | null
          duration_to_bill?: number | null
          end_date_time?: string | null
          hour_value?: number | null
          id?: string
          is_liquidated?: boolean
          reg_facturable_liq_id?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          start_date_time?: string | null
          total_value?: number | null
          tramite_id?: string | null
        }
        Update: {
          activity?: string | null
          activity_id?: string | null
          caso_id?: string | null
          client_id?: string | null
          created_at?: string
          details?: string | null
          duration_real?: number | null
          duration_to_bill?: number | null
          end_date_time?: string | null
          hour_value?: number | null
          id?: string
          is_liquidated?: boolean
          reg_facturable_liq_id?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          start_date_time?: string | null
          total_value?: number | null
          tramite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reg_facturable_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reg_facturable_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reg_facturable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reg_facturable_reg_facturable_liq_id_fkey"
            columns: ["reg_facturable_liq_id"]
            isOneToOne: false
            referencedRelation: "reg_facturable_liq"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reg_facturable_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reg_facturable_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "client_tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      reg_facturable_liq: {
        Row: {
          bill_support: string | null
          caso_id: string | null
          client_id: string | null
          client_liquidation_path: string | null
          client_liquidation_url: string | null
          created_at: string
          duration_total: number | null
          id: string
          internal_liquidation_path: string | null
          internal_liquidation_url: string | null
          liq_code: string | null
          payment_support: string | null
          pdf_url: string | null
          pdf_url_cliente: string | null
          user_id_liquidator: string | null
          value_total: number | null
        }
        Insert: {
          bill_support?: string | null
          caso_id?: string | null
          client_id?: string | null
          client_liquidation_path?: string | null
          client_liquidation_url?: string | null
          created_at?: string
          duration_total?: number | null
          id?: string
          internal_liquidation_path?: string | null
          internal_liquidation_url?: string | null
          liq_code?: string | null
          payment_support?: string | null
          pdf_url?: string | null
          pdf_url_cliente?: string | null
          user_id_liquidator?: string | null
          value_total?: number | null
        }
        Update: {
          bill_support?: string | null
          caso_id?: string | null
          client_id?: string | null
          client_liquidation_path?: string | null
          client_liquidation_url?: string | null
          created_at?: string
          duration_total?: number | null
          id?: string
          internal_liquidation_path?: string | null
          internal_liquidation_url?: string | null
          liq_code?: string | null
          payment_support?: string | null
          pdf_url?: string | null
          pdf_url_cliente?: string | null
          user_id_liquidator?: string | null
          value_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reg_facturable_liq_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reg_facturable_liq_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reg_facturable_liq_user_id_liquidator_fkey"
            columns: ["user_id_liquidator"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          category: string | null
          company_id: string | null
          consultant: boolean | null
          created_at: string
          display_name: string | null
          email: string | null
          enable: boolean | null
          first_login: boolean | null
          hour_value: number | null
          hourly_rates: boolean | null
          id: string
          institution_id: string | null
          names: string | null
          new_notifications: boolean | null
          phone_number: string | null
          photo_url: string | null
          register_by_email: string | null
          register_by_id: string | null
          rol_name: string | null
          surnames: string | null
          title: string | null
          tokenReset: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          consultant?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          enable?: boolean | null
          first_login?: boolean | null
          hour_value?: number | null
          hourly_rates?: boolean | null
          id: string
          institution_id?: string | null
          names?: string | null
          new_notifications?: boolean | null
          phone_number?: string | null
          photo_url?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          rol_name?: string | null
          surnames?: string | null
          title?: string | null
          tokenReset?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          consultant?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          enable?: boolean | null
          first_login?: boolean | null
          hour_value?: number | null
          hourly_rates?: boolean | null
          id?: string
          institution_id?: string | null
          names?: string | null
          new_notifications?: boolean | null
          phone_number?: string | null
          photo_url?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          rol_name?: string | null
          surnames?: string | null
          title?: string | null
          tokenReset?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          {
            foreignKeyName: "users_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_notes: {
        Row: {
          assigned: boolean | null
          audio_duration_seconds: number | null
          audio_url: string | null
          caso_id: string | null
          client_id: string | null
          comment: string | null
          comment_responsible: string | null
          completed: boolean | null
          completed_date: string | null
          created_at: string
          id: string
          name: string | null
          register_by_email: string | null
          register_by_id: string | null
          responsible_id: string | null
          tramite_id: string | null
        }
        Insert: {
          assigned?: boolean | null
          audio_duration_seconds?: number | null
          audio_url?: string | null
          caso_id?: string | null
          client_id?: string | null
          comment?: string | null
          comment_responsible?: string | null
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string
          id?: string
          name?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          responsible_id?: string | null
          tramite_id?: string | null
        }
        Update: {
          assigned?: boolean | null
          audio_duration_seconds?: number | null
          audio_url?: string | null
          caso_id?: string | null
          client_id?: string | null
          comment?: string | null
          comment_responsible?: string | null
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string
          id?: string
          name?: string | null
          register_by_email?: string | null
          register_by_id?: string | null
          responsible_id?: string | null
          tramite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_notes_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "client_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_register_by_id_fkey"
            columns: ["register_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "client_tramites"
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
