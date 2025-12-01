import * as XLSX from 'xlsx';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  totalPoints: number;
  currentWeekPoints: number;
  avgPoints: number;
  byeWeek: number;
  owner_ID: string;
  status: string;
  week_1: number;
  week_2: number;
  week_3: number;
  week_4: number;
  week_5: number;
  week_6: number;
  week_7: number;
  week_8: number;
  week_9: number;
  week_10: number;
  week_11: number;
  week_12: number;
  week_13: number;
  week_14: number;
  week_15: number;
  week_16: number;
  week_17: number;
  week_18: number;
}

/**
 * Export player data to CSV format
 */
export function exportToCSV(players: Player[], filename: string = 'player-stats.csv') {
  // Create CSV headers
  const headers = [
    'Name',
    'Position',
    'Team',
    'Total Points',
    'Avg Points',
    'Current Week Points',
    'Bye Week',
    'Owner ID',
    'Status',
    'Week 1',
    'Week 2',
    'Week 3',
    'Week 4',
    'Week 5',
    'Week 6',
    'Week 7',
    'Week 8',
    'Week 9',
    'Week 10',
    'Week 11',
    'Week 12',
    'Week 13',
    'Week 14',
    'Week 15',
    'Week 16',
    'Week 17',
    'Week 18'
  ];

  // Create CSV rows
  const rows = players.map(player => [
    player.name,
    player.position,
    player.team,
    player.totalPoints.toFixed(1),
    player.avgPoints.toFixed(1),
    player.currentWeekPoints.toFixed(1),
    player.byeWeek.toString(),
    player.owner_ID === '99' ? 'Free Agent' : player.owner_ID,
    player.status,
    player.week_1.toFixed(1),
    player.week_2.toFixed(1),
    player.week_3.toFixed(1),
    player.week_4.toFixed(1),
    player.week_5.toFixed(1),
    player.week_6.toFixed(1),
    player.week_7.toFixed(1),
    player.week_8.toFixed(1),
    player.week_9.toFixed(1),
    player.week_10.toFixed(1),
    player.week_11.toFixed(1),
    player.week_12.toFixed(1),
    player.week_13.toFixed(1),
    player.week_14.toFixed(1),
    player.week_15.toFixed(1),
    player.week_16.toFixed(1),
    player.week_17.toFixed(1),
    player.week_18.toFixed(1)
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export player data to Excel format
 */
export function exportToExcel(players: Player[], filename: string = 'player-stats.xlsx') {
  // Prepare data for Excel
  const excelData = players.map(player => ({
    'Name': player.name,
    'Position': player.position,
    'Team': player.team,
    'Total Points': player.totalPoints,
    'Avg Points': player.avgPoints,
    'Current Week Points': player.currentWeekPoints,
    'Bye Week': player.byeWeek,
    'Owner ID': player.owner_ID === '99' ? 'Free Agent' : player.owner_ID,
    'Status': player.status,
    'Week 1': player.week_1,
    'Week 2': player.week_2,
    'Week 3': player.week_3,
    'Week 4': player.week_4,
    'Week 5': player.week_5,
    'Week 6': player.week_6,
    'Week 7': player.week_7,
    'Week 8': player.week_8,
    'Week 9': player.week_9,
    'Week 10': player.week_10,
    'Week 11': player.week_11,
    'Week 12': player.week_12,
    'Week 13': player.week_13,
    'Week 14': player.week_14,
    'Week 15': player.week_15,
    'Week 16': player.week_16,
    'Week 17': player.week_17,
    'Week 18': player.week_18
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Player Stats');

  // Set column widths for better readability
  const columnWidths = [
    { wch: 25 }, // Name
    { wch: 10 }, // Position
    { wch: 8 },  // Team
    { wch: 12 }, // Total Points
    { wch: 12 }, // Avg Points
    { wch: 18 }, // Current Week Points
    { wch: 10 }, // Bye Week
    { wch: 12 }, // Owner ID
    { wch: 10 }, // Status
    { wch: 8 },  // Week 1-18
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 }
  ];
  worksheet['!cols'] = columnWidths;

  // Write file
  XLSX.writeFile(workbook, filename);
}

