// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import nodemailer from "nodemailer";
import moment from "moment-timezone";

// Environment variables and configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const TIMESTAMP_FORMAT = "YYYY-MM-DD HH:mm:ss";
const DEFAULT_TIMEZONE = process.env.TIMEZONE || "America/Bogota";

// Create MCP server instance
const server = new McpServer({
  name: "zendesk-analytics",
  version: "1.0.0"
});

// Brand and Country mappings
const BRAND_MAPPING = {
  "portal_ccs": "Crocs",
  "portal_xia": "Xiaomi",
  "portal_hof": "Hoff",
  "portal_onr": "On Running",
  "portal_odm": "Ondademar",
  "portal_inv": "Invicta",
  "portal_sca": "Scalpers",
  "portal_cub": "Cubitt",
  "portal_elg": "El Ganso",
  "portal_jbl": "JBL",
  "portal_hp": "HP",
  "portal_del": "Dell",
  "portal_eps": "Epson",
  "portal_mot": "Motorola",
  "portal_hnk": "Harman Kardom"
};

const COUNTRY_MAPPING = {
  "portal_co": "Colombia",
  "portal_cl": "Chile",
  "portal_pe": "Peru",
  "portal_cr": "Costa Rica",
  "portal_gt": "Guatemala",
  "portal_hn": "Honduras",
  "portal_pa": "Panamá",
  "portal_sv": "El Salvador",
  "portal_ec": "Ecuador",
  "portal_mx": "México"
};

// Helper function to extract brand and country from tags
function extractMetadataFromTags(tags) {
  let brand = "Unknown";
  let country = "Unknown";
  
  if (tags && Array.isArray(tags)) {
    // Find brand
    for (const tag of tags) {
      if (BRAND_MAPPING[tag]) {
        brand = BRAND_MAPPING[tag];
        break;
      }
    }
    
    // Find country
    for (const tag of tags) {
      if (COUNTRY_MAPPING[tag]) {
        country = COUNTRY_MAPPING[tag];
        break;
      }
    }
  }
  
  return { brand, country };
}

// Helper function to fetch tickets from your API endpoint
async function fetchTicketsByEmail(email) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/ticket/by-email`, {
      params: { email }
    });
    
    return response.data.result?.results || [];
  } catch (error) {
    console.error("Error fetching tickets:", error.message);
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }
}

// Helper function to analyze ticket data
function analyzeTickets(tickets) {
  // Initialize metrics
  const analysis = {
    totalTickets: tickets.length,
    ticketsByDate: {},
    ticketsByCountry: {},
    ticketsByBrand: {},
    ticketsByStatus: {},
    responseMetrics: {
      firstResponseTimes: [],
      resolutionTimes: [],
      averageFirstResponseTime: 0,
      averageResolutionTime: 0,
      firstResponseTimeByCountry: {},
      firstResponseTimeByBrand: {},
      resolutionTimeByCountry: {},
      resolutionTimeByBrand: {}
    }
  };

  // Process each ticket
  tickets.forEach(ticket => {
    // Extract brand and country from tags
    const { brand, country } = extractMetadataFromTags(ticket.tags);
    
    // Process creation date statistics
    const createdAt = moment(ticket.created_at);
    const dateKey = createdAt.format('YYYY-MM-DD');
    analysis.ticketsByDate[dateKey] = (analysis.ticketsByDate[dateKey] || 0) + 1;
    
    // Process country statistics
    analysis.ticketsByCountry[country] = (analysis.ticketsByCountry[country] || 0) + 1;
    
    // Process brand statistics
    analysis.ticketsByBrand[brand] = (analysis.ticketsByBrand[brand] || 0) + 1;
    
    // Process status statistics
    analysis.ticketsByStatus[ticket.status] = (analysis.ticketsByStatus[ticket.status] || 0) + 1;
    
    // Process response time metrics
    const firstResponseTime = ticket.metric_events?.reply_time_in_minutes?.calendar;
    if (firstResponseTime) {
      analysis.responseMetrics.firstResponseTimes.push(firstResponseTime);
      
      // Group by country
      if (!analysis.responseMetrics.firstResponseTimeByCountry[country]) {
        analysis.responseMetrics.firstResponseTimeByCountry[country] = [];
      }
      analysis.responseMetrics.firstResponseTimeByCountry[country].push(firstResponseTime);
      
      // Group by brand
      if (!analysis.responseMetrics.firstResponseTimeByBrand[brand]) {
        analysis.responseMetrics.firstResponseTimeByBrand[brand] = [];
      }
      analysis.responseMetrics.firstResponseTimeByBrand[brand].push(firstResponseTime);
    }
    
    // Calculate resolution time if the ticket is solved
    if (ticket.status === 'solved' && ticket.solved_at) {
      const solvedAt = moment(ticket.solved_at);
      const resolutionTime = solvedAt.diff(createdAt, 'minutes');
      
      analysis.responseMetrics.resolutionTimes.push(resolutionTime);
      
      // Group by country
      if (!analysis.responseMetrics.resolutionTimeByCountry[country]) {
        analysis.responseMetrics.resolutionTimeByCountry[country] = [];
      }
      analysis.responseMetrics.resolutionTimeByCountry[country].push(resolutionTime);
      
      // Group by brand
      if (!analysis.responseMetrics.resolutionTimeByBrand[brand]) {
        analysis.responseMetrics.resolutionTimeByBrand[brand] = [];
      }
      analysis.responseMetrics.resolutionTimeByBrand[brand].push(resolutionTime);
    }
  });
  
  // Calculate averages
  if (analysis.responseMetrics.firstResponseTimes.length > 0) {
    analysis.responseMetrics.averageFirstResponseTime = 
      analysis.responseMetrics.firstResponseTimes.reduce((sum, time) => sum + time, 0) / 
      analysis.responseMetrics.firstResponseTimes.length;
  }
  
  if (analysis.responseMetrics.resolutionTimes.length > 0) {
    analysis.responseMetrics.averageResolutionTime = 
      analysis.responseMetrics.resolutionTimes.reduce((sum, time) => sum + time, 0) / 
      analysis.responseMetrics.resolutionTimes.length;
  }
  
  // Calculate averages by country for first response time
  Object.entries(analysis.responseMetrics.firstResponseTimeByCountry).forEach(([country, times]) => {
    if (times.length > 0) {
      analysis.responseMetrics.firstResponseTimeByCountry[country] = {
        times,
        average: times.reduce((sum, time) => sum + time, 0) / times.length,
        count: times.length
      };
    }
  });
  
  // Calculate averages by brand for first response time
  Object.entries(analysis.responseMetrics.firstResponseTimeByBrand).forEach(([brand, times]) => {
    if (times.length > 0) {
      analysis.responseMetrics.firstResponseTimeByBrand[brand] = {
        times,
        average: times.reduce((sum, time) => sum + time, 0) / times.length,
        count: times.length
      };
    }
  });
  
  // Calculate averages by country for resolution time
  Object.entries(analysis.responseMetrics.resolutionTimeByCountry).forEach(([country, times]) => {
    if (times.length > 0) {
      analysis.responseMetrics.resolutionTimeByCountry[country] = {
        times,
        average: times.reduce((sum, time) => sum + time, 0) / times.length,
        count: times.length
      };
    }
  });
  
  // Calculate averages by brand for resolution time
  Object.entries(analysis.responseMetrics.resolutionTimeByBrand).forEach(([brand, times]) => {
    if (times.length > 0) {
      analysis.responseMetrics.resolutionTimeByBrand[brand] = {
        times,
        average: times.reduce((sum, time) => sum + time, 0) / times.length,
        count: times.length
      };
    }
  });
  
  return analysis;
}

// Helper function to generate XLSX report
function generateXLSXReport(analysis, tickets) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create summary sheet
  const summaryData = [
    ["Zendesk Ticket Analysis Summary"],
    ["Generated", moment().format(TIMESTAMP_FORMAT)],
    [""],
    ["Total Tickets", analysis.totalTickets],
    ["Average First Response Time (minutes)", analysis.responseMetrics.averageFirstResponseTime.toFixed(2)],
    ["Average Resolution Time (minutes)", analysis.responseMetrics.averageResolutionTime.toFixed(2)],
    ["Average Resolution Time (hours)", (analysis.responseMetrics.averageResolutionTime / 60).toFixed(2)],
    [""]
  ];
  
  // Add status breakdown
  summaryData.push(["Tickets By Status"]);
  summaryData.push(["Status", "Count", "Percentage"]);
  
  Object.entries(analysis.ticketsByStatus)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percentage = (count / analysis.totalTickets * 100).toFixed(2);
      summaryData.push([status, count, `${percentage}%`]);
    });
  
  summaryData.push([""]);
  
  // Add tickets by country section
  summaryData.push(["Tickets By Country"]);
  summaryData.push(["Country", "Count", "Percentage"]);
  
  Object.entries(analysis.ticketsByCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      const percentage = (count / analysis.totalTickets * 100).toFixed(2);
      summaryData.push([country, count, `${percentage}%`]);
    });
  
  summaryData.push([""]);
  
  // Add tickets by brand section
  summaryData.push(["Tickets By Brand"]);
  summaryData.push(["Brand", "Count", "Percentage"]);
  
  Object.entries(analysis.ticketsByBrand)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      const percentage = (count / analysis.totalTickets * 100).toFixed(2);
      summaryData.push([brand, count, `${percentage}%`]);
    });
  
  summaryData.push([""]);
  
  // Add response time by country
  summaryData.push(["Average First Response Time By Country (minutes)"]);
  summaryData.push(["Country", "Average Time (minutes)", "Ticket Count"]);
  
  Object.entries(analysis.responseMetrics.firstResponseTimeByCountry)
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => a[1].average - b[1].average)
    .forEach(([country, data]) => {
      summaryData.push([country, data.average.toFixed(2), data.count]);
    });
  
  summaryData.push([""]);
  
  // Add response time by brand
  summaryData.push(["Average First Response Time By Brand (minutes)"]);
  summaryData.push(["Brand", "Average Time (minutes)", "Ticket Count"]);
  
  Object.entries(analysis.responseMetrics.firstResponseTimeByBrand)
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => a[1].average - b[1].average)
    .forEach(([brand, data]) => {
      summaryData.push([brand, data.average.toFixed(2), data.count]);
    });
  
  // Create summary worksheet
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  
  // Create daily ticket creation sheet
  const dailyData = [["Date", "Ticket Count"]];
  
  Object.entries(analysis.ticketsByDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, count]) => {
      dailyData.push([date, count]);
    });
  
  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Ticket Creation");
  
  // Create tickets detail sheet
  const ticketDetailData = [
    ["ID", "Subject", "Status", "Created", "First Response (min)", "Resolution Time (min)", "Country", "Brand"]
  ];
  
  tickets.forEach(ticket => {
    const { brand, country } = extractMetadataFromTags(ticket.tags);
    const createdAt = moment(ticket.created_at);
    const solvedAt = ticket.solved_at ? moment(ticket.solved_at) : null;
    const resolutionTime = solvedAt ? solvedAt.diff(createdAt, 'minutes') : null;
    
    ticketDetailData.push([
      ticket.id,
      ticket.subject,
      ticket.status,
      createdAt.format(TIMESTAMP_FORMAT),
      ticket.metric_events?.reply_time_in_minutes?.calendar || "N/A",
      resolutionTime !== null ? resolutionTime : "N/A",
      country,
      brand
    ]);
  });
  
  const ticketSheet = XLSX.utils.aoa_to_sheet(ticketDetailData);
  XLSX.utils.book_append_sheet(workbook, ticketSheet, "Ticket Details");
  
  // Create country analysis sheet
  const countryData = [
    ["Country", "Total Tickets", "Average First Response (min)", "Average Resolution Time (min)"]
  ];
  
  Object.entries(analysis.ticketsByCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      const responseData = analysis.responseMetrics.firstResponseTimeByCountry[country];
      const resolutionData = analysis.responseMetrics.resolutionTimeByCountry[country];
      
      countryData.push([
        country,
        count,
        responseData ? responseData.average.toFixed(2) : "N/A",
        resolutionData ? resolutionData.average.toFixed(2) : "N/A"
      ]);
    });
  
  const countrySheet = XLSX.utils.aoa_to_sheet(countryData);
  XLSX.utils.book_append_sheet(workbook, countrySheet, "Country Analysis");
  
  // Create brand analysis sheet
  const brandData = [
    ["Brand", "Total Tickets", "Average First Response (min)", "Average Resolution Time (min)"]
  ];
  
  Object.entries(analysis.ticketsByBrand)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      const responseData = analysis.responseMetrics.firstResponseTimeByBrand[brand];
      const resolutionData = analysis.responseMetrics.resolutionTimeByBrand[brand];
      
      brandData.push([
        brand,
        count,
        responseData ? responseData.average.toFixed(2) : "N/A",
        resolutionData ? resolutionData.average.toFixed(2) : "N/A"
      ]);
    });
  
  const brandSheet = XLSX.utils.aoa_to_sheet(brandData);
  XLSX.utils.book_append_sheet(workbook, brandSheet, "Brand Analysis");
  
  // Save workbook to a temporary file
  const timestamp = moment().format('YYYY-MM-DD-HHmmss');
  const filename = `zendesk-analytics-${timestamp}.xlsx`;
  const filePath = path.join(os.tmpdir(), filename);
  
  XLSX.writeFile(workbook, filePath);
  return { filePath, filename };
}

// Helper function to generate text summary
function generateTextSummary(analysis, period) {
  let summary = `# Zendesk Ticket Analysis Summary\n\n`;
  
  summary += `## Overview\n`;
  summary += `- Total Tickets: ${analysis.totalTickets}\n`;
  summary += `- Average First Response Time: ${analysis.responseMetrics.averageFirstResponseTime.toFixed(2)} minutes (${(analysis.responseMetrics.averageFirstResponseTime / 60).toFixed(2)} hours)\n`;
  summary += `- Average Resolution Time: ${analysis.responseMetrics.averageResolutionTime.toFixed(2)} minutes (${(analysis.responseMetrics.averageResolutionTime / 60).toFixed(2)} hours)\n\n`;
  
  // Add status breakdown
  summary += `## Ticket Status Breakdown\n`;
  Object.entries(analysis.ticketsByStatus)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percentage = (count / analysis.totalTickets * 100).toFixed(2);
      summary += `- ${status}: ${count} tickets (${percentage}%)\n`;
    });
  summary += "\n";
  
  // Calculate ticket creation frequency
  const days = Object.keys(analysis.ticketsByDate).length || 1;
  const ticketsPerDay = analysis.totalTickets / days;
  
  summary += `## Ticket Creation Frequency\n`;
  summary += `- Average tickets per day: ${ticketsPerDay.toFixed(2)}\n`;
  summary += `- Average tickets per week: ${(ticketsPerDay * 7).toFixed(2)}\n`;
  summary += `- Average tickets per month: ${(ticketsPerDay * 30).toFixed(2)}\n\n`;
  
  // Top countries
  summary += `## Top Countries\n`;
  Object.entries(analysis.ticketsByCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([country, count]) => {
      const percentage = (count / analysis.totalTickets * 100).toFixed(2);
      summary += `- ${country}: ${count} tickets (${percentage}%)\n`;
    });
  summary += "\n";
  
  // Top brands
  summary += `## Top Brands\n`;
  Object.entries(analysis.ticketsByBrand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([brand, count]) => {
      const percentage = (count / analysis.totalTickets * 100).toFixed(2);
      summary += `- ${brand}: ${count} tickets (${percentage}%)\n`;
    });
  summary += "\n";
  
  // Response time insights
  summary += `## Response Time Insights\n`;
  
  // Fastest/slowest countries for first response
  const countryResponseTimes = Object.entries(analysis.responseMetrics.firstResponseTimeByCountry)
    .filter(([_, data]) => data && data.count >= 5) // Only consider countries with enough data
    .sort((a, b) => a[1].average - b[1].average);
  
  if (countryResponseTimes.length > 0) {
    const fastestCountry = countryResponseTimes[0];
    const slowestCountry = countryResponseTimes[countryResponseTimes.length - 1];
    
    summary += `- Fastest first response by country: ${fastestCountry[0]} (${fastestCountry[1].average.toFixed(2)} minutes)\n`;
    summary += `- Slowest first response by country: ${slowestCountry[0]} (${slowestCountry[1].average.toFixed(2)} minutes)\n`;
  }
  
  // Fastest/slowest brands for first response
  const brandResponseTimes = Object.entries(analysis.responseMetrics.firstResponseTimeByBrand)
    .filter(([_, data]) => data && data.count >= 5) // Only consider brands with enough data
    .sort((a, b) => a[1].average - b[1].average);
  
  if (brandResponseTimes.length > 0) {
    const fastestBrand = brandResponseTimes[0];
    const slowestBrand = brandResponseTimes[brandResponseTimes.length - 1];
    
    summary += `- Fastest first response by brand: ${fastestBrand[0]} (${fastestBrand[1].average.toFixed(2)} minutes)\n`;
    summary += `- Slowest first response by brand: ${slowestBrand[0]} (${slowestBrand[1].average.toFixed(2)} minutes)\n`;
  }
  
  // Response time assessment
  let responseRating = "";
  if (analysis.responseMetrics.averageFirstResponseTime < 60) {
    responseRating = "excellent";
  } else if (analysis.responseMetrics.averageFirstResponseTime < 240) {
    responseRating = "good";
  } else {
    responseRating = "needs improvement";
  }
  
  let resolutionRating = "";
  if (analysis.responseMetrics.averageResolutionTime < 1440) { // Less than 24 hours
    resolutionRating = "excellent";
  } else if (analysis.responseMetrics.averageResolutionTime < 4320) { // Less than 3 days
    resolutionRating = "good";
  } else {
    resolutionRating = "needs improvement";
  }
  
  summary += `- Response time efficiency is ${responseRating}\n`;
  summary += `- Resolution time efficiency is ${resolutionRating}\n`;
  
  return summary;
}

// Helper function to send email with report
async function sendEmailWithReport(emailTo, reportPath, subject, body) {
  // For demonstration purposes only - in a real application, you would configure this
  // to use your actual email service
  console.log(`Would send email to ${emailTo} with attachment ${reportPath}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  // In a real implementation, you would uncomment and configure this:
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: emailTo,
    subject: subject,
    text: body,
    attachments: [
      {
        filename: path.basename(reportPath),
        path: reportPath
      }
    ]
  });
  
  return info;
  */
  
  return {
    messageId: "mock-email-id",
    accepted: [emailTo],
    rejected: []
  };
}

// Register MCP tools

// Tool: Generate complete ticket analysis report
server.tool(
  "analyze-tickets",
  "Analyze Zendesk tickets, generate a summary and an XLSX report",
  {
    email: z.string().email().describe("Email address used to fetch tickets"),
    days: z.number().optional().default(30).describe("Number of days to analyze tickets from"),
    emailTo: z.string().email().describe("Email address to send the report to")
  },
  async ({ email, days, emailTo }) => {
    try {
      // 1. Fetch tickets from your API
      const tickets = await fetchTicketsByEmail(email);
      
      // Filter tickets by date if needed
      const filteredTickets = days 
        ? tickets.filter(ticket => {
            const ticketDate = moment(ticket.created_at);
            const cutoffDate = moment().subtract(days, 'days');
            return ticketDate.isAfter(cutoffDate);
          })
        : tickets;
      
      // 2. Analyze ticket data
      const analysis = analyzeTickets(filteredTickets);
      
      // 3. Generate XLSX report
      const { filePath, filename } = generateXLSXReport(analysis, filteredTickets);
      
      // 4. Generate summary text
      const summary = generateTextSummary(analysis, days);
      
      // 5. Send report via email
      await sendEmailWithReport(
        emailTo,
        filePath,
        `Zendesk Ticket Analysis Report - ${moment().format('YYYY-MM-DD')}`,
        `Please find attached the Zendesk ticket analysis report.\n\n${summary}`
      );
      
      return {
        content: [
          { 
            type: "text", 
            text: `${summary}\n\nReport has been sent to ${emailTo} with file ${filename}`
          }
        ]
      };
    } catch (error) {
      console.error("Error in analyze-tickets:", error);
      return {
        content: [
          { 
            type: "text", 
            text: `Error analyzing tickets: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Get ticket frequency metrics
server.tool(
  "ticket-frequency",
  "Get frequency of ticket creation and calculate average creation rates",
  {
    email: z.string().email().describe("Email address used to fetch tickets"),
    days: z
      .number()
      .optional()
      .default(30)
      .describe("Number of days to analyze"),
    groupBy: z
      .enum(["day", "week", "month"])
      .default("day")
      .describe("How to group the tickets"),
  },
  async ({ email, days, groupBy }) => {
    try {
      // Fetch tickets
      const tickets = await fetchTicketsByEmail(email);

      // Filter tickets by date if needed
      const filteredTickets = days
        ? tickets.filter((ticket) => {
            const ticketDate = moment(ticket.created_at);
            const cutoffDate = moment().subtract(days, "days");
            return ticketDate.isAfter(cutoffDate);
          })
        : tickets;

      // Group tickets by the specified time period
      const frequency = {};

      filteredTickets.forEach((ticket) => {
        const ticketDate = moment(ticket.created_at);
        let key;

        if (groupBy === "day") {
          key = ticketDate.format("YYYY-MM-DD");
        } else if (groupBy === "week") {
          // Get start of week and format
          const weekStart = ticketDate.clone().startOf("week");
          key = weekStart.format("YYYY-MM-DD");
        } else if (groupBy === "month") {
          key = ticketDate.format("YYYY-MM");
        }

        frequency[key] = (frequency[key] || 0) + 1;
      });

      // Calculate stats
      const frequencies = Object.values(frequency);
      const total = frequencies.reduce((sum, count) => sum + count, 0);
      const average = frequencies.length > 0 ? total / frequencies.length : 0;

      // Sort entries by date
      const sortedFrequency = Object.entries(frequency).sort((a, b) =>
        a[0].localeCompare(b[0])
      );

      // Format results
      let result = `# Ticket Creation Frequency Analysis\n\n`;
      result += `Analysis of ${filteredTickets.length} tickets over the past ${days} days, grouped by ${groupBy}.\n\n`;

      result += `## Ticket Counts by ${
        groupBy.charAt(0).toUpperCase() + groupBy.slice(1)
      }\n\n`;

      sortedFrequency.forEach(([period, count]) => {
        let formattedPeriod = period;

        if (groupBy === "week") {
          formattedPeriod = `Week starting ${period}`;
        } else if (groupBy === "month") {
          const [year, month] = period.split("-");
          formattedPeriod = `${moment(`${year}-${month}-01`).format(
            "MMMM YYYY"
          )}`;
        }

        result += `- ${formattedPeriod}: ${count} tickets\n`;
      });

      result += `\n## Statistics\n`;
      result += `- Total tickets: ${total}\n`;
      result += `- Average per ${groupBy}: ${average.toFixed(2)} tickets\n`;

      if (frequencies.length > 0) {
        result += `- Maximum in a single ${groupBy}: ${Math.max(
          ...frequencies
        )} tickets\n`;
        result += `- Minimum in a single ${groupBy}: ${Math.min(
          ...frequencies
        )} tickets\n`;
      }

      // Create frequency trend analysis
      if (sortedFrequency.length > 1) {
        const firstPeriodCount = sortedFrequency[0][1];
        const lastPeriodCount = sortedFrequency[sortedFrequency.length - 1][1];
        const trend =
          ((lastPeriodCount - firstPeriodCount) / firstPeriodCount) * 100;

        result += `\n## Trend Analysis\n`;
        if (trend > 0) {
          result += `- Ticket volume has increased by ${trend.toFixed(
            2
          )}% from first to last ${groupBy}\n`;
        } else if (trend < 0) {
          result += `- Ticket volume has decreased by ${Math.abs(trend).toFixed(
            2
          )}% from first to last ${groupBy}\n`;
        } else {
          result += `- Ticket volume has remained stable from first to last ${groupBy}\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error in ticket-frequency:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing ticket frequency: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get response time analysis
server.tool(
  "response-times",
  "Calculate and analyze response times for tickets",
  {
    email: z.string().email().describe("Email address used to fetch tickets"),
    days: z
      .number()
      .optional()
      .default(30)
      .describe("Number of days to analyze"),
    groupBy: z
      .enum(["brand", "country", "none"])
      .default("none")
      .describe("How to group the results"),
  },
  async ({ email, days, groupBy }) => {
    try {
      // Fetch tickets
      const tickets = await fetchTicketsByEmail(email);

      // Filter tickets by date if needed
      const filteredTickets = days
        ? tickets.filter((ticket) => {
            const ticketDate = moment(ticket.created_at);
            const cutoffDate = moment().subtract(days, "days");
            return ticketDate.isAfter(cutoffDate);
          })
        : tickets;

      // Process response times
      const firstResponseTimes = [];
      const resolutionTimes = [];

      // For grouping
      const firstResponseTimesByGroup = {};
      const resolutionTimesByGroup = {};
      const ticketCountByGroup = {};

      filteredTickets.forEach((ticket) => {
        // Get group key based on grouping parameter
        let groupKey = "Overall";

        if (groupBy === "country") {
          const { country } = extractMetadataFromTags(ticket.tags);
          groupKey = country;
        } else if (groupBy === "brand") {
          const { brand } = extractMetadataFromTags(ticket.tags);
          groupKey = brand;
        }

        // Initialize group arrays if not exists
        if (!firstResponseTimesByGroup[groupKey]) {
          firstResponseTimesByGroup[groupKey] = [];
        }

        if (!resolutionTimesByGroup[groupKey]) {
          resolutionTimesByGroup[groupKey] = [];
        }

        // Count tickets per group
        ticketCountByGroup[groupKey] = (ticketCountByGroup[groupKey] || 0) + 1;

        // Process first response time
        const firstResponseTime =
          ticket.metric_events?.reply_time_in_minutes?.calendar;
        if (firstResponseTime) {
          firstResponseTimes.push(firstResponseTime);
          firstResponseTimesByGroup[groupKey].push(firstResponseTime);
        }

        // Process resolution time
        if (ticket.status === "solved" && ticket.solved_at) {
          const created = moment(ticket.created_at);
          const solved = moment(ticket.solved_at);
          const resolutionTime = solved.diff(created, "minutes");

          resolutionTimes.push(resolutionTime);
          resolutionTimesByGroup[groupKey].push(resolutionTime);
        }
      });

      // Calculate overall averages
      const avgFirstResponseTime =
        firstResponseTimes.length > 0
          ? firstResponseTimes.reduce((sum, time) => sum + time, 0) /
            firstResponseTimes.length
          : 0;

      const avgResolutionTime =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
            resolutionTimes.length
          : 0;

      // Calculate group averages
      const groupStats = {};

      Object.keys(ticketCountByGroup).forEach((group) => {
        const groupFirstResponseTimes = firstResponseTimesByGroup[group] || [];
        const groupResolutionTimes = resolutionTimesByGroup[group] || [];

        const avgGroupFirstResponse =
          groupFirstResponseTimes.length > 0
            ? groupFirstResponseTimes.reduce((sum, time) => sum + time, 0) /
              groupFirstResponseTimes.length
            : 0;

        const avgGroupResolution =
          groupResolutionTimes.length > 0
            ? groupResolutionTimes.reduce((sum, time) => sum + time, 0) /
              groupResolutionTimes.length
            : 0;

        groupStats[group] = {
          totalTickets: ticketCountByGroup[group],
          firstResponse: {
            average: avgGroupFirstResponse,
            count: groupFirstResponseTimes.length,
            percentage:
              ticketCountByGroup[group] > 0
                ? (
                    (groupFirstResponseTimes.length /
                      ticketCountByGroup[group]) *
                    100
                  ).toFixed(2)
                : 0,
          },
          resolution: {
            average: avgGroupResolution,
            count: groupResolutionTimes.length,
            percentage:
              ticketCountByGroup[group] > 0
                ? (
                    (groupResolutionTimes.length / ticketCountByGroup[group]) *
                    100
                  ).toFixed(2)
                : 0,
          },
        };
      });

      // Format results
      let result = `# Ticket Response Time Analysis\n\n`;
      result += `Analysis of ${filteredTickets.length} tickets over the past ${days} days.\n\n`;

      result += `## Overall Response Metrics\n`;
      result += `- Average First Response Time: ${avgFirstResponseTime.toFixed(
        2
      )} minutes (${(avgFirstResponseTime / 60).toFixed(2)} hours)\n`;
      result += `- Average Resolution Time: ${avgResolutionTime.toFixed(
        2
      )} minutes (${(avgResolutionTime / 24 / 60).toFixed(2)} days)\n`;
      result += `- Tickets with measured first response: ${
        firstResponseTimes.length
      } of ${filteredTickets.length} (${(
        (firstResponseTimes.length / filteredTickets.length) *
        100
      ).toFixed(2)}%)\n`;
      result += `- Tickets resolved: ${resolutionTimes.length} of ${
        filteredTickets.length
      } (${((resolutionTimes.length / filteredTickets.length) * 100).toFixed(
        2
      )}%)\n\n`;

      if (groupBy !== "none") {
        result += `## Response Metrics by ${
          groupBy.charAt(0).toUpperCase() + groupBy.slice(1)
        }\n\n`;

        // Sort groups by response time (ascending)
        const sortedGroups = Object.entries(groupStats)
          .filter(([_, stats]) => stats.totalTickets >= 5) // Only include groups with enough data
          .sort(
            (a, b) => a[1].firstResponse.average - b[1].firstResponse.average
          );

        sortedGroups.forEach(([group, stats]) => {
          result += `### ${group}\n`;
          result += `- Total Tickets: ${stats.totalTickets}\n`;
          result += `- Average First Response Time: ${stats.firstResponse.average.toFixed(
            2
          )} minutes (${(stats.firstResponse.average / 60).toFixed(
            2
          )} hours)\n`;
          result += `- Measured First Responses: ${stats.firstResponse.count} tickets (${stats.firstResponse.percentage}%)\n`;
          result += `- Average Resolution Time: ${stats.resolution.average.toFixed(
            2
          )} minutes (${(stats.resolution.average / 24 / 60).toFixed(
            2
          )} days)\n`;
          result += `- Resolved Tickets: ${stats.resolution.count} tickets (${stats.resolution.percentage}%)\n\n`;
        });

        // Add fastest/slowest insights
        if (sortedGroups.length > 0) {
          result += `## Response Time Insights\n`;
          const fastest = sortedGroups[0];
          const slowest = sortedGroups[sortedGroups.length - 1];

          result += `- Fastest response time: ${
            fastest[0]
          } with ${fastest[1].firstResponse.average.toFixed(2)} minutes\n`;
          result += `- Slowest response time: ${
            slowest[0]
          } with ${slowest[1].firstResponse.average.toFixed(2)} minutes\n`;
          result += `- Difference between fastest and slowest: ${(
            slowest[1].firstResponse.average - fastest[1].firstResponse.average
          ).toFixed(2)} minutes\n\n`;
        }
      }

      // Add resolution time distribution
      if (resolutionTimes.length > 0) {
        result += `## Resolution Time Distribution\n`;

        // Count tickets in different resolution time brackets
        const brackets = {
          "< 1 hour": 0,
          "1-4 hours": 0,
          "4-24 hours": 0,
          "1-3 days": 0,
          "> 3 days": 0,
        };

        resolutionTimes.forEach((time) => {
          if (time < 60) brackets["< 1 hour"]++;
          else if (time < 240) brackets["1-4 hours"]++;
          else if (time < 1440) brackets["4-24 hours"]++;
          else if (time < 4320) brackets["1-3 days"]++;
          else brackets["> 3 days"]++;
        });

        Object.entries(brackets).forEach(([bracket, count]) => {
          const percentage = ((count / resolutionTimes.length) * 100).toFixed(
            2
          );
          result += `- ${bracket}: ${count} tickets (${percentage}%)\n`;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error in response-times:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error calculating response times: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Analyze tickets by brand
server.tool(
  "brand-analysis",
  "Analyze tickets grouped by brand",
  {
    email: z.string().email().describe("Email address used to fetch tickets"),
    days: z
      .number()
      .optional()
      .default(30)
      .describe("Number of days to analyze"),
    emailTo: z
      .string()
      .email()
      .optional()
      .describe("Optional email to send report to"),
  },
  async ({ email, days, emailTo }) => {
    try {
      // Fetch tickets
      const tickets = await fetchTicketsByEmail(email);

      // Filter tickets by date if needed
      const filteredTickets = days
        ? tickets.filter((ticket) => {
            const ticketDate = moment(ticket.created_at);
            const cutoffDate = moment().subtract(days, "days");
            return ticketDate.isAfter(cutoffDate);
          })
        : tickets;

      // Group tickets by brand
      const brandStats = {};

      filteredTickets.forEach((ticket) => {
        const { brand } = extractMetadataFromTags(ticket.tags);

        if (!brandStats[brand]) {
          brandStats[brand] = {
            count: 0,
            statuses: {},
            responseTimeSum: 0,
            responseTimeCount: 0,
            resolutionTimeSum: 0,
            resolutionTimeCount: 0,
            creationDates: {},
          };
        }

        // Increment count
        brandStats[brand].count++;

        // Track status
        brandStats[brand].statuses[ticket.status] =
          (brandStats[brand].statuses[ticket.status] || 0) + 1;

        // Track first response time
        const firstResponseTime =
          ticket.metric_events?.reply_time_in_minutes?.calendar;
        if (firstResponseTime) {
          brandStats[brand].responseTimeSum += firstResponseTime;
          brandStats[brand].responseTimeCount++;
        }

        // Track resolution time
        if (ticket.status === "solved" && ticket.solved_at) {
          const created = moment(ticket.created_at);
          const solved = moment(ticket.solved_at);
          const resolutionTime = solved.diff(created, "minutes");

          brandStats[brand].resolutionTimeSum += resolutionTime;
          brandStats[brand].resolutionTimeCount++;
        }

        // Track creation date
        const createdAt = moment(ticket.created_at);
        const dateKey = createdAt.format("YYYY-MM-DD");
        brandStats[brand].creationDates[dateKey] =
          (brandStats[brand].creationDates[dateKey] || 0) + 1;
      });

      // Calculate averages and prepare data for report
      Object.keys(brandStats).forEach((brand) => {
        const stats = brandStats[brand];

        // Calculate average response time
        stats.avgResponseTime =
          stats.responseTimeCount > 0
            ? stats.responseTimeSum / stats.responseTimeCount
            : 0;

        // Calculate average resolution time
        stats.avgResolutionTime =
          stats.resolutionTimeCount > 0
            ? stats.resolutionTimeSum / stats.resolutionTimeCount
            : 0;

        // Calculate tickets per day
        const uniqueDates = Object.keys(stats.creationDates).length;
        stats.ticketsPerDay = uniqueDates > 0 ? stats.count / uniqueDates : 0;
      });

      // Generate XLSX report if emailTo is provided
      let reportPath = "";
      let reportFilename = "";

      if (emailTo) {
        const workbook = XLSX.utils.book_new();

        // Create brand summary sheet
        const brandData = [
          ["Brand Analysis Report", "", "", ""],
          ["Generated", moment().format(TIMESTAMP_FORMAT), "", ""],
          ["Analysis Period", `Last ${days} days`, "", ""],
          ["", "", "", ""],
          [
            "Brand",
            "Total Tickets",
            "Tickets Per Day",
            "Average Response Time (min)",
            "Average Resolution Time (min)",
          ],
        ];

        Object.entries(brandStats)
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([brand, stats]) => {
            brandData.push([
              brand,
              stats.count,
              stats.ticketsPerDay.toFixed(2),
              stats.avgResponseTime.toFixed(2),
              stats.avgResolutionTime.toFixed(2),
            ]);
          });

        const brandSheet = XLSX.utils.aoa_to_sheet(brandData);
        XLSX.utils.book_append_sheet(workbook, brandSheet, "Brand Summary");

        // Create detailed brand sheets for top brands
        Object.entries(brandStats)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5) // Top 5 brands get detailed sheets
          .forEach(([brand, stats]) => {
            const brandDetailData = [
              [`${brand} - Detailed Analysis`, "", ""],
              ["Total Tickets", stats.count, ""],
              [
                "Average Response Time (min)",
                stats.avgResponseTime.toFixed(2),
                "",
              ],
              [
                "Average Resolution Time (min)",
                stats.avgResolutionTime.toFixed(2),
                "",
              ],
              ["Tickets Per Day", stats.ticketsPerDay.toFixed(2), ""],
              ["", "", ""],
              ["Status Breakdown", "", ""],
              ["Status", "Count", "Percentage"],
            ];

            // Add status breakdown
            Object.entries(stats.statuses)
              .sort((a, b) => b[1] - a[1])
              .forEach(([status, count]) => {
                const percentage = ((count / stats.count) * 100).toFixed(2);
                brandDetailData.push([status, count, `${percentage}%`]);
              });

            // Add daily ticket creation
            brandDetailData.push(["", "", ""]);
            brandDetailData.push(["Daily Ticket Creation", "", ""]);
            brandDetailData.push(["Date", "Count", ""]);

            Object.entries(stats.creationDates)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .forEach(([date, count]) => {
                brandDetailData.push([date, count, ""]);
              });

            const detailSheet = XLSX.utils.aoa_to_sheet(brandDetailData);
            XLSX.utils.book_append_sheet(
              workbook,
              detailSheet,
              brand.substring(0, 30)
            ); // Limit sheet name length
          });

        // Save workbook
        const timestamp = moment().format("YYYY-MM-DD-HHmmss");
        reportFilename = `brand-analysis-${timestamp}.xlsx`;
        reportPath = path.join(os.tmpdir(), reportFilename);

        XLSX.writeFile(workbook, reportPath);

        // Send report via email
        await sendEmailWithReport(
          emailTo,
          reportPath,
          `Zendesk Brand Analysis Report - ${moment().format("YYYY-MM-DD")}`,
          `Please find attached the Zendesk brand analysis report covering the last ${days} days.`
        );
      }

      // Generate text summary
      let result = `# Zendesk Ticket Analysis by Brand\n\n`;
      result += `Analysis of ${filteredTickets.length} tickets over the past ${days} days.\n\n`;

      // Overall brand distribution
      result += `## Brand Distribution\n`;

      Object.entries(brandStats)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([brand, stats]) => {
          const percentage = (
            (stats.count / filteredTickets.length) *
            100
          ).toFixed(2);
          result += `- ${brand}: ${stats.count} tickets (${percentage}%)\n`;
        });

      result += `\n## Key Performance Metrics by Brand\n\n`;

      // Create a table-like format
      result += `| Brand | Tickets | Per Day | Avg Response (min) | Avg Resolution (min) |\n`;
      result += `|-------|---------|---------|-------------------|---------------------|\n`;

      Object.entries(brandStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10) // Top 10 brands
        .forEach(([brand, stats]) => {
          result += `| ${brand} | ${
            stats.count
          } | ${stats.ticketsPerDay.toFixed(
            2
          )} | ${stats.avgResponseTime.toFixed(
            2
          )} | ${stats.avgResolutionTime.toFixed(2)} |\n`;
        });

      result += `\n## Top Performing Brands (by Response Time)\n`;

      // Only include brands with enough data
      const responseBrands = Object.entries(brandStats)
        .filter(([_, stats]) => stats.responseTimeCount >= 5)
        .sort((a, b) => a[1].avgResponseTime - b[1].avgResponseTime);

      // Top 3 fastest responding brands
      responseBrands.slice(0, 3).forEach(([brand, stats], index) => {
        result += `${index + 1}. ${brand}: ${stats.avgResponseTime.toFixed(
          2
        )} minutes\n`;
      });

      result += `\n## Brand Status Distribution\n`;

      // Get the top 5 brands by volume
      const topBrands = Object.entries(brandStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      topBrands.forEach(([brand, stats]) => {
        result += `\n### ${brand}\n`;

        Object.entries(stats.statuses)
          .sort((a, b) => b[1] - a[1])
          .forEach(([status, count]) => {
            const percentage = ((count / stats.count) * 100).toFixed(2);
            result += `- ${status}: ${count} tickets (${percentage}%)\n`;
          });
      });

      // Add email notification if sent
      if (emailTo) {
        result += `\n\nA detailed Excel report has been sent to ${emailTo}.`;
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error in brand-analysis:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing tickets by brand: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Analyze tickets by country
server.tool(
  "country-analysis",
  "Analyze tickets grouped by country",
  {
    email: z.string().email().describe("Email address used to fetch tickets"),
    days: z
      .number()
      .optional()
      .default(30)
      .describe("Number of days to analyze"),
    emailTo: z
      .string()
      .email()
      .optional()
      .describe("Optional email to send report to"),
  },
  async ({ email, days, emailTo }) => {
    try {
      // Fetch tickets
      const tickets = await fetchTicketsByEmail(email);

      // Filter tickets by date if needed
      const filteredTickets = days
        ? tickets.filter((ticket) => {
            const ticketDate = moment(ticket.created_at);
            const cutoffDate = moment().subtract(days, "days");
            return ticketDate.isAfter(cutoffDate);
          })
        : tickets;

      // Group tickets by country
      const countryStats = {};

      filteredTickets.forEach((ticket) => {
        const { country } = extractMetadataFromTags(ticket.tags);

        if (!countryStats[country]) {
          countryStats[country] = {
            count: 0,
            statuses: {},
            brands: {},
            responseTimeSum: 0,
            responseTimeCount: 0,
            resolutionTimeSum: 0,
            resolutionTimeCount: 0,
            creationDates: {},
          };
        }

        // Increment count
        countryStats[country].count++;

        // Track status
        countryStats[country].statuses[ticket.status] =
          (countryStats[country].statuses[ticket.status] || 0) + 1;

        // Track brand distribution
        const { brand } = extractMetadataFromTags(ticket.tags);
        countryStats[country].brands[brand] =
          (countryStats[country].brands[brand] || 0) + 1;

        // Track first response time
        const firstResponseTime =
          ticket.metric_events?.reply_time_in_minutes?.calendar;
        if (firstResponseTime) {
          countryStats[country].responseTimeSum += firstResponseTime;
          countryStats[country].responseTimeCount++;
        }

        // Track resolution time
        if (ticket.status === "solved" && ticket.solved_at) {
          const created = moment(ticket.created_at);
          const solved = moment(ticket.solved_at);
          const resolutionTime = solved.diff(created, "minutes");

          countryStats[country].resolutionTimeSum += resolutionTime;
          countryStats[country].resolutionTimeCount++;
        }

        // Track creation date
        const createdAt = moment(ticket.created_at);
        const dateKey = createdAt.format("YYYY-MM-DD");
        countryStats[country].creationDates[dateKey] =
          (countryStats[country].creationDates[dateKey] || 0) + 1;
      });

      // Calculate averages and prepare data for report
      Object.keys(countryStats).forEach((country) => {
        const stats = countryStats[country];

        // Calculate average response time
        stats.avgResponseTime =
          stats.responseTimeCount > 0
            ? stats.responseTimeSum / stats.responseTimeCount
            : 0;

        // Calculate average resolution time
        stats.avgResolutionTime =
          stats.resolutionTimeCount > 0
            ? stats.resolutionTimeSum / stats.resolutionTimeCount
            : 0;

        // Calculate tickets per day
        const uniqueDates = Object.keys(stats.creationDates).length;
        stats.ticketsPerDay = uniqueDates > 0 ? stats.count / uniqueDates : 0;
      });

      // Generate XLSX report if emailTo is provided
      let reportPath = "";
      let reportFilename = "";

      if (emailTo) {
        const workbook = XLSX.utils.book_new();

        // Create country summary sheet
        const countryData = [
          ["Country Analysis Report", "", "", ""],
          ["Generated", moment().format(TIMESTAMP_FORMAT), "", ""],
          ["Analysis Period", `Last ${days} days`, "", ""],
          ["", "", "", ""],
          [
            "Country",
            "Total Tickets",
            "Tickets Per Day",
            "Average Response Time (min)",
            "Average Resolution Time (min)",
          ],
        ];

        Object.entries(countryStats)
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([country, stats]) => {
            countryData.push([
              country,
              stats.count,
              stats.ticketsPerDay.toFixed(2),
              stats.avgResponseTime.toFixed(2),
              stats.avgResolutionTime.toFixed(2),
            ]);
          });

        const countrySheet = XLSX.utils.aoa_to_sheet(countryData);
        XLSX.utils.book_append_sheet(workbook, countrySheet, "Country Summary");

        // Create detailed country sheets for top countries
        Object.entries(countryStats)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5) // Top 5 countries get detailed sheets
          .forEach(([country, stats]) => {
            const countryDetailData = [
              [`${country} - Detailed Analysis`, "", ""],
              ["Total Tickets", stats.count, ""],
              [
                "Average Response Time (min)",
                stats.avgResponseTime.toFixed(2),
                "",
              ],
              [
                "Average Resolution Time (min)",
                stats.avgResolutionTime.toFixed(2),
                "",
              ],
              ["Tickets Per Day", stats.ticketsPerDay.toFixed(2), ""],
              ["", "", ""],
              ["Status Breakdown", "", ""],
              ["Status", "Count", "Percentage"],
            ];

            // Add status breakdown
            Object.entries(stats.statuses)
              .sort((a, b) => b[1] - a[1])
              .forEach(([status, count]) => {
                const percentage = ((count / stats.count) * 100).toFixed(2);
                countryDetailData.push([status, count, `${percentage}%`]);
              });

            // Add brand breakdown
            countryDetailData.push(["", "", ""]);
            countryDetailData.push(["Brand Distribution", "", ""]);
            countryDetailData.push(["Brand", "Count", "Percentage"]);

            Object.entries(stats.brands)
              .sort((a, b) => b[1] - a[1])
              .forEach(([brand, count]) => {
                const percentage = ((count / stats.count) * 100).toFixed(2);
                countryDetailData.push([brand, count, `${percentage}%`]);
              });

            const detailSheet = XLSX.utils.aoa_to_sheet(countryDetailData);
            XLSX.utils.book_append_sheet(
              workbook,
              detailSheet,
              country.substring(0, 30)
            ); // Limit sheet name length
          });

        // Save workbook
        const timestamp = moment().format("YYYY-MM-DD-HHmmss");
        reportFilename = `country-analysis-${timestamp}.xlsx`;
        reportPath = path.join(os.tmpdir(), reportFilename);

        XLSX.writeFile(workbook, reportPath);

        // Send report via email
        await sendEmailWithReport(
          emailTo,
          reportPath,
          `Zendesk Country Analysis Report - ${moment().format("YYYY-MM-DD")}`,
          `Please find attached the Zendesk country analysis report covering the last ${days} days.`
        );
      }

      // Generate text summary
      let result = `# Zendesk Ticket Analysis by Country\n\n`;
      result += `Analysis of ${filteredTickets.length} tickets over the past ${days} days.\n\n`;

      // Overall country distribution
      result += `## Country Distribution\n`;

      Object.entries(countryStats)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([country, stats]) => {
          const percentage = (
            (stats.count / filteredTickets.length) *
            100
          ).toFixed(2);
          result += `- ${country}: ${stats.count} tickets (${percentage}%)\n`;
        });

      result += `\n## Key Performance Metrics by Country\n\n`;

      // Create a table-like format
      result += `| Country | Tickets | Per Day | Avg Response (min) | Avg Resolution (min) |\n`;
      result += `|---------|---------|---------|-------------------|---------------------|\n`;

      Object.entries(countryStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10) // Top 10 countries
        .forEach(([country, stats]) => {
          result += `| ${country} | ${
            stats.count
          } | ${stats.ticketsPerDay.toFixed(
            2
          )} | ${stats.avgResponseTime.toFixed(
            2
          )} | ${stats.avgResolutionTime.toFixed(2)} |\n`;
        });

      result += `\n## Country-Specific Brand Distribution\n`;

      // Get the top 3 countries by volume
      const topCountries = Object.entries(countryStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3);

      topCountries.forEach(([country, stats]) => {
        result += `\n### ${country}\n`;

        Object.entries(stats.brands)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5) // Top 5 brands per country
          .forEach(([brand, count]) => {
            const percentage = ((count / stats.count) * 100).toFixed(2);
            result += `- ${brand}: ${count} tickets (${percentage}%)\n`;
          });
      });

      // Add email notification if sent
      if (emailTo) {
        result += `\n\nA detailed Excel report has been sent to ${emailTo}.`;
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error in country-analysis:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing tickets by country: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Zendesk Analytics MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});