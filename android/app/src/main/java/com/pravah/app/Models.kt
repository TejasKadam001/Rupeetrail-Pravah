package com.pravah.app

data class WorkOrderRecord(
    val work_order_id: String,
    val contractor_id: String,
    val contractor_name: String,
    val work_type: String,
    val repair_method: String,
    val cost_inr: Double,
    val area_sqm: Double,
    val completed_at: String,
    val sla_met: Boolean,
    val reopened_within_30d: Boolean,
    val engineer_remark: String
)

data class RoadRecord(
    val id: String,
    val name: String,
    val segment_no: Int,
    val ward_code: String,
    val road_type: String,
    val surface: String,
    val lanes: Int,
    val length_m: Int,
    val last_resurfaced: String,
    val under_dlp: Boolean,
    val bus_route: Boolean,
    val contractor_name: String,
    val contractor_id: String,
    val total_spent_inr: Double,
    val work_orders_count: Int,
    val reopened_count: Int,
    val latest_work_order: WorkOrderRecord? = null
)

data class WardRecord(
    val code: String,
    val name: String,
    val zone: String,
    val office: String,
    val area_km2: Double,
    val population: Long,
    val budget_inr: Double,
    val localities: List<String>
)

data class ContractorRecord(
    val id: String,
    val name: String,
    val empanelled_since: Int,
    val active_wards: List<String>
)

data class ChatMessage(
    val id: String,
    val role: String, // "user" or "assistant"
    val content: String,
    val matchedRoad: RoadRecord? = null,
    val timestamp: String
)
