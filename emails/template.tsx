import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
} from "@react-email/components";
import * as React from "react";

const mainStyle = {
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f4f4f4",
  padding: "20px 0",
};

const cardStyle = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  padding: "30px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
};

const headingStyle = {
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "16px",
};

const textStyle = {
  fontSize: "16px",
  lineHeight: "1.5",
  marginBottom: "20px",
};

const buttonStyle = {
  backgroundColor: "#007BFF",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "6px",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
};

type EmailType = "monthly-report" | "budget-alert";

interface EmailProps {
  userName?: string;
  type?: EmailType;
  data?: {
    percentageUsed?: number;
    budgetAmount?: number;
    totalExpenses?: number;
    month?: string;
    stats?: {
      totalIncome?: number;
      totalExpenses?: number;
      byCategory?: Record<string, number>;
    };
    insights?: string[];
    [key: string]: unknown;
  };
}

export default function EmailTemplate({
  userName = "",
  type = "budget-alert",
  data = {},
}: EmailProps) {
  const content: Record<EmailType, {
    title: string;
    message: string;
    buttonLabel: string;
    buttonLink: string;
  }> = {
    "monthly-report": {
      title: "Your Monthly Report is Ready",
      message: "Here’s your financial summary for this month, powered by FinCrest AI Insights.",
      buttonLabel: "View Full Report",
      buttonLink: "https://fincrest.app/dashboard",
    },
    "budget-alert": {
      title: "Budget Alert: You're Almost There",
      message:
        "You’ve reached your budget limit for the month. Consider adjusting to avoid overspending.",
      buttonLabel: "View Budget",
      buttonLink: "https://fincrest.app/budget",
    },
  };

  const current = content[type];

  // Budget Alert Data
  const percentageUsed =
    typeof data?.percentageUsed === "number"
      ? data.percentageUsed.toFixed(1)
      : "0";
  const budgetAmount =
    typeof data?.budgetAmount === "number" ? data.budgetAmount : 0;
  const totalExpenses =
    typeof data?.totalExpenses === "number" ? data.totalExpenses : 0;
  const remaining = (budgetAmount - totalExpenses).toFixed(2);

  // Monthly Report Data
  const totalIncome = data?.stats?.totalIncome ?? 0;
  const monthlyExpenses = data?.stats?.totalExpenses ?? 0;
  const net = (totalIncome - monthlyExpenses).toFixed(2);
  const month = data?.month ?? "this month";

  return (
    <Html>
      <Head />
      <Preview>{current.title}</Preview>
      <Body style={mainStyle}>
        <Container style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Section style={cardStyle}>
            <Text style={headingStyle}>Hi {userName},</Text>
            <Text style={textStyle}>{current.message}</Text>

            {/* Budget Alert Section */}
            {type === "budget-alert" && (
              <>
                <Text style={{ ...textStyle, fontWeight: "bold", marginTop: "10px" }}>
                  📊 Budget Summary
                </Text>
                <Text style={textStyle}>
                  You've used {percentageUsed}% of your monthly budget.
                </Text>
                <Text style={textStyle}>💰 Budget Amount: ₹{budgetAmount}</Text>
                <Text style={textStyle}>🧾 Spent So Far: ₹{totalExpenses}</Text>
                <Text style={textStyle}>🟢 Remaining: ₹{remaining}</Text>
              </>
            )}

            {/* Monthly Report Section */}
            {type === "monthly-report" && (
              <>
                <Text style={{ ...textStyle, fontWeight: "bold" }}>
                  📆 Monthly Summary for {month}
                </Text>
                <Text style={textStyle}>💼 Total Income: ₹{totalIncome}</Text>
                <Text style={textStyle}>🧾 Total Expenses: ₹{monthlyExpenses}</Text>
                <Text style={textStyle}>📈 Net: ₹{net}</Text>

                {data?.stats?.byCategory && (
                  <>
                    <Text style={{ ...textStyle, fontWeight: "bold", marginTop: "20px" }}>
                      📂 Expenses by Category
                    </Text>
                    {Object.entries(data.stats.byCategory).map(([category, amount]) => (
                      <Text key={category} style={textStyle}>
                        • {category}: ₹{amount}
                      </Text>
                    ))}
                  </>
                )}

                {data?.insights && (
                  <>
                    <Text style={{ ...textStyle, fontWeight: "bold", marginTop: "20px" }}>
                      🤖 FinCrest AI Insights
                    </Text>
                    {data.insights.map((insight, index) => (
                      <Text key={index} style={textStyle}>
                        • {insight}
                      </Text>
                    ))}
                  </>
                )}
              </>
            )}

            <Button href={current.buttonLink} style={buttonStyle}>
              {current.buttonLabel}
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
