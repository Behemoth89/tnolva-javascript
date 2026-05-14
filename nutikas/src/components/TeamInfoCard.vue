<script setup lang="ts">
/**
 * TeamInfoCard — displays team name, class, and member names in a compact card
 * Used in the race view per D-12 (team info card shows team name, class, registered members)
 */

defineProps<{
  teamName: string
  contestClassName: string
  memberNames: string | null
}>()

/**
 * Format member names for display
 * Split by comma and return as formatted list items
 */
function formatMembers(names: string | null): string[] {
  if (!names) return []
  return names.split(',').map(n => n.trim()).filter(n => n.length > 0)
}
</script>

<template>
  <div class="team-info-card">
    <h3 class="team-name">{{ teamName }}</h3>
    <div class="class-badge">{{ contestClassName }}</div>
    <div v-if="memberNames" class="members">
      <span class="members-label">Team Members:</span>
      <ul class="member-list">
        <li v-for="(member, index) in formatMembers(memberNames)" :key="index">
          {{ member }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.team-info-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.team-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.class-badge {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.members {
  font-size: 0.875rem;
  color: #666;
}

.members-label {
  font-weight: 500;
  margin-right: 0.25rem;
}

.member-list {
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
}

.member-list li {
  margin-bottom: 0.25rem;
}

.member-list li:last-child {
  margin-bottom: 0;
}
</style>