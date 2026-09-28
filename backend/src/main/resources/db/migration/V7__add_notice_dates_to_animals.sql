-- 이미 부분 적용된 경우를 고려하여 개별 컬럼 추가
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'animals' AND column_name = 'register_date');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE animals ADD COLUMN register_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'animals' AND column_name = 'notice_start_date');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE animals ADD COLUMN notice_start_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'animals' AND column_name = 'notice_end_date');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE animals ADD COLUMN notice_end_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'animals' AND index_name = 'idx_animals_notice_end_date');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_animals_notice_end_date ON animals (notice_end_date)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
