CREATE TABLE `accidents` (
	`accident_id` text PRIMARY KEY NOT NULL,
	`occurred_at` text,
	`ward_code` text,
	`road_id` text,
	`lat` real,
	`lon` real,
	`vehicle_type` text,
	`severity` text,
	`probable_cause` text
);
--> statement-breakpoint
CREATE INDEX `accidents_road_id_idx` ON `accidents` (`road_id`);--> statement-breakpoint
CREATE TABLE `accountability` (
	`id` text PRIMARY KEY NOT NULL,
	`ward` text,
	`road` text,
	`road_name` text,
	`contractor` text,
	`contractor_name` text,
	`issue` text,
	`method` text,
	`assigned` text,
	`completed` text,
	`area` real,
	`qty` real,
	`unit` text,
	`rate` integer,
	`billed` integer,
	`benchmark` integer,
	`variance` integer,
	`variance_pct` real,
	`price_flag` integer,
	`sla_met` integer,
	`sla_hours` integer,
	`elapsed` real,
	`reopened` integer,
	`dlp` integer,
	`duplicate` text,
	`linked` integer,
	`raw_score` real,
	`case_score` real,
	`rain_mm` real,
	`search` text
);
--> statement-breakpoint
CREATE INDEX `accountability_ward_idx` ON `accountability` (`ward`);--> statement-breakpoint
CREATE INDEX `accountability_contractor_idx` ON `accountability` (`contractor`);--> statement-breakpoint
CREATE INDEX `accountability_road_idx` ON `accountability` (`road`);--> statement-breakpoint
CREATE INDEX `accountability_assigned_idx` ON `accountability` (`assigned`);--> statement-breakpoint
CREATE TABLE `complaint_links` (
	`complaint_id` text NOT NULL,
	`work_order_id` text NOT NULL,
	PRIMARY KEY(`complaint_id`, `work_order_id`)
);
--> statement-breakpoint
CREATE INDEX `complaint_links_work_order_id_idx` ON `complaint_links` (`work_order_id`);--> statement-breakpoint
CREATE TABLE `complaints` (
	`complaint_id` text PRIMARY KEY NOT NULL,
	`received_at` text,
	`channel` text,
	`category_reported` text,
	`description` text,
	`language` text,
	`locality_text` text,
	`ward_code` text,
	`lat` real,
	`lon` real,
	`gps_accuracy_m` integer,
	`photo_url` text,
	`photo_description` text,
	`complainant_id` text,
	`upvotes` integer,
	`status` text,
	`resolved_at` text
);
--> statement-breakpoint
CREATE TABLE `complaints_sample_200` (
	`complaint_id` text PRIMARY KEY NOT NULL,
	`received_at` text,
	`channel` text,
	`category_reported` text,
	`description` text,
	`language` text,
	`locality_text` text,
	`ward_code` text,
	`lat` real,
	`lon` real,
	`gps_accuracy_m` integer,
	`photo_url` text,
	`photo_description` text,
	`complainant_id` text,
	`upvotes` integer,
	`status` text,
	`resolved_at` text
);
--> statement-breakpoint
CREATE TABLE `contractors` (
	`contractor_id` text PRIMARY KEY NOT NULL,
	`contractor_name` text,
	`empanelled_since` integer,
	`active_wards` text
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`facility_id` text PRIMARY KEY NOT NULL,
	`type` text,
	`name` text,
	`ward_code` text,
	`lat` real,
	`lon` real,
	`beds_or_students` integer,
	`emergency_services` text,
	`ambulance_entry_road` text
);
--> statement-breakpoint
CREATE INDEX `facilities_ambulance_entry_road_idx` ON `facilities` (`ambulance_entry_road`);--> statement-breakpoint
CREATE TABLE `flood_hotspots` (
	`hotspot_id` text PRIMARY KEY NOT NULL,
	`name` text,
	`ward_code` text,
	`lat` real,
	`lon` real,
	`flood_threshold_mm_per_day` integer,
	`tide_sensitive` text,
	`avg_water_depth_cm` integer,
	`avg_recession_hours` real,
	`pumping_station_nearby` text,
	`years_flagged_last_5` integer
);
--> statement-breakpoint
CREATE TABLE `import_state` (
	`version` text PRIMARY KEY NOT NULL,
	`cursor` integer
);
--> statement-breakpoint
CREATE TABLE `localities` (
	`locality` text NOT NULL,
	`ward_code` text NOT NULL,
	`lat` real,
	`lon` real,
	`aliases` text,
	PRIMARY KEY(`locality`, `ward_code`)
);
--> statement-breakpoint
CREATE TABLE `next_rupee` (
	`id` text PRIMARY KEY NOT NULL,
	`ward` text,
	`name` text,
	`segment` integer,
	`lat1` real,
	`lon1` real,
	`lat2` real,
	`lon2` real,
	`orders` integer,
	`linked` integer,
	`reopened` integer,
	`billed` integer,
	`dlp` integer,
	`score` real,
	`tier` text,
	`station` text,
	`heavy` integer,
	`wet_days` integer,
	`compound` integer,
	`hotspot` text,
	`hotspot_name` text,
	`dist_m` real,
	`flood_points` real,
	`traffic_points` real,
	`safety_points` real,
	`access_points` real,
	`history_points` real,
	`vehicles` integer,
	`congestion` real,
	`accidents` integer,
	`road_accidents` integer,
	`severe` integer,
	`facilities` integer,
	`hospitals` integer,
	`schools` integer,
	`action` text,
	`method` text,
	`unit` text,
	`qty` real,
	`rate` integer,
	`method_reopen` real,
	`estimate` integer,
	`search` text
);
--> statement-breakpoint
CREATE INDEX `next_rupee_ward_idx` ON `next_rupee` (`ward`);--> statement-breakpoint
CREATE INDEX `next_rupee_score_idx` ON `next_rupee` (`score`);--> statement-breakpoint
CREATE TABLE `rainfall_daily` (
	`date` text NOT NULL,
	`station` text NOT NULL,
	`rainfall_mm` real,
	`imd_category` text,
	`imd_alert` text,
	PRIMARY KEY(`date`, `station`)
);
--> statement-breakpoint
CREATE TABLE `rate_card` (
	`repair_method` text PRIMARY KEY NOT NULL,
	`unit` text,
	`standard_rate_inr` integer
);
--> statement-breakpoint
CREATE TABLE `roads` (
	`road_id` text PRIMARY KEY NOT NULL,
	`road_name` text,
	`segment_no` integer,
	`ward_code` text,
	`road_type` text,
	`surface` text,
	`lanes` integer,
	`length_m` integer,
	`start_lat` real,
	`start_lon` real,
	`end_lat` real,
	`end_lon` real,
	`last_resurfaced` text,
	`under_dlp` text,
	`bus_route` text
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`post_id` text PRIMARY KEY NOT NULL,
	`posted_at` text,
	`source` text,
	`author_handle` text,
	`text` text,
	`has_media` text,
	`likes_or_forwards` integer
);
--> statement-breakpoint
CREATE TABLE `source_catalog` (
	`file` text PRIMARY KEY NOT NULL,
	`table_name` text,
	`rows` integer,
	`sha256` text
);
--> statement-breakpoint
CREATE TABLE `tides` (
	`date` text NOT NULL,
	`high_tide_time` text NOT NULL,
	`height_m` real,
	`big_tide_flag` text,
	PRIMARY KEY(`date`, `high_tide_time`)
);
--> statement-breakpoint
CREATE TABLE `traceability` (
	`id` text PRIMARY KEY NOT NULL,
	`ward` text,
	`ward_source` text,
	`locality` text,
	`locality_text` text,
	`received` text,
	`issue` text,
	`status` text,
	`channel` text,
	`linked` integer,
	`followup` integer,
	`work_ids` text,
	`search` text
);
--> statement-breakpoint
CREATE INDEX `traceability_ward_idx` ON `traceability` (`ward`);--> statement-breakpoint
CREATE INDEX `traceability_received_idx` ON `traceability` (`received`);--> statement-breakpoint
CREATE TABLE `traffic` (
	`road_id` text PRIMARY KEY NOT NULL,
	`peak_hour_vehicles` integer,
	`avg_peak_speed_kmph` real,
	`congestion_index_0_10` real,
	`bus_routes_count` integer,
	`two_wheeler_share_pct` integer
);
--> statement-breakpoint
CREATE TABLE `wards` (
	`ward_code` text PRIMARY KEY NOT NULL,
	`ward_name` text,
	`zone` text,
	`assistant_commissioner_office` text,
	`centroid_lat` real,
	`centroid_lon` real,
	`approx_area_km2` real,
	`population_est` integer,
	`low_lying_index` real,
	`engineering_crews` integer,
	`localities` text,
	`monsoon_repair_budget_inr_2025` integer
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`work_order_id` text PRIMARY KEY NOT NULL,
	`linked_complaint_ids` text,
	`ward_code` text,
	`road_id` text,
	`work_type` text,
	`repair_method` text,
	`contractor_id` text,
	`contractor_name` text,
	`assigned_at` text,
	`work_started_at` text,
	`completed_at` text,
	`area_sqm` real,
	`cost_inr` integer,
	`sla_hours` integer,
	`sla_met` text,
	`reopened_within_30d` text,
	`engineer_remark` text
);
--> statement-breakpoint
CREATE INDEX `work_orders_road_id_idx` ON `work_orders` (`road_id`);