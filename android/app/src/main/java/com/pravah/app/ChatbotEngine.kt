package com.pravah.app

import java.util.Locale

class ChatbotEngine(private val repository: DataRepository) {

    private fun cleanString(str: String): String {
        return str.lowercase(Locale.ROOT)
            .replace(Regex("[^a-z0-9\\s]"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
    }

    private fun calculateMatchScore(query: String, roadName: String): Double {
        val q = cleanString(query)
        val r = cleanString(roadName)

        if (q.contains(r) || r.contains(q)) return 1.0

        val qWords = q.split(" ").filter { it.length > 2 }
        val rWords = r.split(" ").filter { it.length > 2 }

        var wordMatches = 0
        for (qw in qWords) {
            if (rWords.any { rw -> rw.contains(qw) || qw.contains(rw) }) {
                wordMatches++
            }
        }

        if (qWords.isNotEmpty() && wordMatches > 0) {
            return (wordMatches.toDouble() / qWords.size) * 0.8
        }

        // Simple character match fallback
        var dist = 0
        val minLen = minOf(q.length, r.length)
        for (i in 0 until minLen) {
            if (q[i] == r[i]) dist++
        }

        return dist.toDouble() / maxOf(q.length, r.length)
    }

    fun findMatchingRoad(query: String): RoadRecord? {
        var bestRoad: RoadRecord? = null
        var highestScore = 0.0

        for (road in repository.roads) {
            val score = calculateMatchScore(query, road.name)
            if (score > highestScore && score > 0.45) {
                highestScore = score
                bestRoad = road
            }
        }

        return bestRoad
    }

    fun generateLocalRoadAnswer(query: String): String {
        val road = findMatchingRoad(query) ?: return "I couldn't identify the specific Mumbai road from your query. Could you please specify the road name (e.g., \"SV Road\", \"Veer Nariman Road\", \"Colaba Causeway\", \"LBS Marg\")?"

        val contractor = repository.getContractor(road.contractor_id)
        val ward = repository.wards.find { it.code == road.ward_code }

        val dlpStatus = if (road.under_dlp) {
            "Yes, this road is currently under a mandatory Defect Liability Period (DLP) warranty. The contractor is legally obligated under BMC GCC Clause 20 to repair any potholes or defects for ₹0 at zero cost to citizens."
        } else {
            "This corridor is currently outside its active DLP warranty and is covered under routine BMC ward maintenance."
        }

        val workOrderInfo = if (road.latest_work_order != null) {
            "The latest recorded maintenance was Work Order ${road.latest_work_order.work_order_id} (${road.latest_work_order.work_type} via ${road.latest_work_order.repair_method}) at a cost of ₹${String.format("%,.0f", road.latest_work_order.cost_inr)}. Engineer remark: \"${road.latest_work_order.engineer_remark.ifEmpty { "Completed as per site conditions" }}\"."
        } else {
            "Total recorded monsoon expenditure on this segment is ₹${String.format("%,.0f", road.total_spent_inr)}."
        }

        return "The contractor responsible for **${road.name}** (Segment ${road.segment_no}, Ward ${road.ward_code}${if (ward != null) " — ${ward.name.split(",")[0]}" else ""}) is **${road.contractor_name}**${if (contractor != null) " (Empanelled since ${contractor.empanelled_since})" else ""}.\n\n" +
                "**Pavement Details:**\n" +
                "- **Surface Material:** ${road.surface}\n" +
                "- **Length & Lanes:** ${road.length_m} meters, ${road.lanes} lanes\n" +
                "- **Warranty Status:** ${dlpStatus}\n\n" +
                "**Recent Maintenance History:**\n" +
                "${workOrderInfo}"
    }
}
