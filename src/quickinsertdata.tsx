import { Action, ActionPanel, Detail, Form, List, useNavigation } from "@raycast/api";
import React, { useState } from "react";
/**
 * SQL解析逻辑
 */
function parseSql(sql: string) {
  const match = sql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(.*)/s);
  if (!match) throw new Error("无法解析 SQL 语句");
  const [, tableName, columns, firstValues, rest] = match;
  const columnNames = columns.split(",").map((c) => c.trim()).filter((col) => col);
  const rows = [firstValues, ...rest.match(/\(([^)]+)\)/g)?.map((v) => v.slice(1, -1)) || []];
  const rowData = rows
    .map((row) =>
      row.split(",").map((value) => value.trim().replace(/['"]/g, ""))
    )
    .filter((row) => row.some((value) => value.trim() !== ""));
  return { tableName, columnNames, rowData };
}

function generateSql({
  tableName,
  columnNames,
  rowData,
}: {
  tableName: string;
  columnNames: string[];
  rowData: string[][];
}) {
  const columnsStr = columnNames.join(", ");
  const valuesStr = rowData
    .map((row) => `(${row.map((value) => `'${value}'`).join(", ")})`)
    .join(",\n ");

  return `INSERT INTO ${tableName} (\n ${columnsStr}\n)\nVALUES\n ${valuesStr}`;
}

/**
 * 主组件
 */
export default function Command() {
  const { push } = useNavigation();
  const [sql, setSql] = useState<string>(`INSERT INTO sdep_tender_fees (
          tenant_id,
          tender_fees_num
         )
         VALUES
          (
           252107,
           'TEF20241101010005'
          ),
          (
           252108,
           'TEF20241101010006'
          )`);
  const [tableData, setTableData] = useState<{
    tableName: string;
    columnNames: string[];
    rowData: string[][];
  } | null>(null);

  const handleSqlSubmit = (inputSql: string) => {
    try {
      const parsed = parseSql(inputSql);
      setSql(inputSql);
      setTableData(parsed);
      push(<EditTable tableData={parsed} onTableDataChange={setTableData} />);
    } catch (error) {
      push(
        <Detail markdown={`# 错误\n无法解析 SQL，请检查输入。\n\n${error}`} />
      );
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="解析 Sql" onSubmit={({ sqlInput }) => handleSqlSubmit(sqlInput)} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="sqlInput" title="输入 SQL" defaultValue={sql} placeholder="输入 INSERT SQL..." />
    </Form>
  );
}

/**
 * 编辑表格
 */
function EditTable({
  tableData,
  onTableDataChange,
}: {
  tableData: { tableName: string; columnNames: string[]; rowData: string[][] };
  onTableDataChange: React.Dispatch<
    React.SetStateAction<{
      tableName: string;
      columnNames: string[];
      rowData: string[][];
    } | null>
  >;
}) {
  const { columnNames, rowData } = tableData;
  const { push } = useNavigation();

  const handleRowClick = (rowIndex: number) => {
    push(
      <EditRowForm
        rowIndex={rowIndex}
        columnNames={columnNames}
        rowData={rowData}
        onSave={(updatedRow) => {
          const updatedRows = [...rowData];
          updatedRows[rowIndex] = updatedRow;
          onTableDataChange((prev) => (prev ? { ...prev, rowData: updatedRows } : null));
        }}
      />
    );
  };

  const handleGenerateSql = () => {
    if (tableData) {
      const newSql = generateSql(tableData);
      push(<SqlOutput sql={newSql} />);
    }
  };

  return (
    <List>
      <List.Section title="表格内容">
        {rowData.map((row, rowIndex) => (
          <List.Item
            key={rowIndex}
            title={`行 ${rowIndex + 1}`}
            accessories={columnNames.map((col, colIndex) => ({
              text: `${col}: ${row[colIndex]}`,
            }))}
            actions={
              <ActionPanel>
                <Action title="查看/编辑明细" onAction={() => handleRowClick(rowIndex)} />
                <Action title="生成 Sql" onAction={handleGenerateSql} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

/**
 * 编辑行表单页面
 */
function EditRowForm({
  rowIndex,
  columnNames,
  rowData,
  onSave,
}: {
  rowIndex: number;
  columnNames: string[];
  rowData: string[][];
  onSave: (updatedRow: string[]) => void;
}) {
  const { pop } = useNavigation();
  const [row, setRow] = useState([...rowData[rowIndex]]);

  const handleFieldChange = (index: number, value: string) => {
    const updatedRow = [...row];
    updatedRow[index] = value.trim();
    setRow(updatedRow);
  };

  const handleSave = () => {
    onSave(row);
    pop();
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="保存" onSubmit={handleSave} />
        </ActionPanel>
      }
    >
      {columnNames.map((col, index) => (
        <Form.TextField
          key={index}
          id={`field-${index}`}
          title={col}
          value={row[index]}
          onChange={(value) => handleFieldChange(index, value)}
        />
      ))}
    </Form>
  );
}

/**
 * 输出 SQL 结果组件
 */
function SqlOutput({ sql }: { sql: string }) {
  return (
    <Detail
      markdown={`# 新 SQL\n\n\`\`\`sql\n${sql}\n\`\`\`\n`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={sql} title="复制 Sql 到剪贴板" />
        </ActionPanel>
      }
    />
  );
}
