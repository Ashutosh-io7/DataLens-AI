import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function AnalysisChart({ chart }) {
  if (
    !chart ||
    !Array.isArray(chart.data) ||
    chart.data.length === 0
  ) {
    return null;
  }

  const {
    type,
    title,
    data,
    x_field,
    y_field,
    x_label,
    y_label,
    orientation,
  } = chart;

  const getAxisDataKey = (field, fallback) => {
    if (field) {
      return field;
    }

    return fallback;
  };

  const renderBarChart = () => {
    const horizontal =
      orientation === "horizontal";

    return (
      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={!horizontal}
            horizontal={horizontal}
          />

          <XAxis
            type={horizontal ? "number" : "category"}
            dataKey={
              horizontal
                ? undefined
                : getAxisDataKey(x_field, "label")
            }
            tick={{
              fontSize: 11,
            }}
            tickLine={false}
            axisLine={false}
            label={
              !horizontal
                ? {
                    value: x_label,
                    position: "insideBottom",
                    offset: -5,
                    fontSize: 11,
                  }
                : undefined
            }
          />

          <YAxis
            type={horizontal ? "category" : "number"}
            dataKey={
              horizontal
                ? getAxisDataKey(x_field, "label")
                : undefined
            }
            width={horizontal ? 90 : 45}
            tick={{
              fontSize: 11,
            }}
            tickLine={false}
            axisLine={false}
            label={
              horizontal
                ? {
                    value: x_label,
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                  }
                : undefined
            }
          />

          <Tooltip />

          <Bar
            dataKey={getAxisDataKey(y_field, "value")}
            name={y_label || "Value"}
            radius={
              horizontal
                ? [0, 5, 5, 0]
                : [5, 5, 0, 0]
            }
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => (
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <LineChart
        data={data}
        margin={{
          top: 10,
          right: 20,
          left: 0,
          bottom: 10,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
        />

        <XAxis
          dataKey={getAxisDataKey(
            x_field,
            "label"
          )}
          tick={{
            fontSize: 11,
          }}
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          tick={{
            fontSize: 11,
          }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip />

        <Legend />

        <Line
          type="monotone"
          dataKey={getAxisDataKey(
            y_field,
            "value"
          )}
          name={y_label || "Value"}
          strokeWidth={2}
          dot={{
            r: 3,
          }}
          activeDot={{
            r: 5,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer
      width="100%"
      height={320}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey={getAxisDataKey(
            y_field,
            "value"
          )}
          nameKey={getAxisDataKey(
            x_field,
            "label"
          )}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="78%"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={`${entry.label}-${index}`}
            />
          ))}
        </Pie>

        <Tooltip />

        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderScatterChart = () => (
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <ScatterChart
        margin={{
          top: 10,
          right: 20,
          bottom: 10,
          left: 0,
        }}
      >
        <CartesianGrid />

        <XAxis
          type="number"
          dataKey="x"
          name={x_label}
          tick={{
            fontSize: 11,
          }}
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          type="number"
          dataKey="y"
          name={y_label}
          tick={{
            fontSize: 11,
          }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip cursor={{ strokeDasharray: "3 3" }} />

        <Scatter
          name={y_label || "Value"}
          data={data}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (type) {
      case "line":
        return renderLineChart();

      case "pie":
      case "donut":
        return renderPieChart();

      case "scatter":
        return renderScatterChart();

      case "histogram":
      case "bar":
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {title || "Analysis"}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              {y_label && x_label
                ? `${y_label} by ${x_label}`
                : "Data visualization"}
            </p>
          </div>

          <span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {type}
          </span>
        </div>
      </div>

      <div className="p-4">
        {renderChart()}
      </div>
    </div>
  );
}

export default AnalysisChart;