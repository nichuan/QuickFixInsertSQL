import { Form, Icon,Action,ActionPanel, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";

interface TableColumn {
  name: string;
  value: string;
}

function parseInsertSQL(sql: string): TableColumn[] {
  const regex = /INSERT INTO (\w+) \(([\w\s,]+)\) VALUES \(([\w\s',]+)\)/i;
  const match = sql.match(regex);
  if (!match) {
    throw new Error("Invalid INSERT SQL statement");
  }

  const columns = match[2].split(", ").map((col) => col.trim());
  const values = match[3].split(", ").map((val) => val.trim().replace(/'/g, ""));

  return columns.map((name, index) => ({ name, value: values[index] }));
}

function generateInsertSQL(tableName: string, columns: TableColumn[]): string {
  const columnNames = columns.map((col) => col.name).join(", ");
  const values = columns.map((col) => `'${col.value}'`).join(", ");
  return `INSERT INTO ${tableName} (${columnNames}) VALUES (${values});`;
}

export default function InsertSQLPlugin() {
  const [sql, setSQL] = useState("");
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const { push } = useNavigation();

  useEffect(() => {
    if (isParsed) {
      try {
        const parsedColumns = parseInsertSQL(sql);
        setColumns(parsedColumns);
        const regex = /INSERT INTO (\w+)/i;
        const match = sql.match(regex);
        if (match) {
          setTableName(match[1]);
        }
      } catch (error) {
        showToast(Toast.Style.Failure, "Error", error.message);
        setIsParsed(false);
      }
    }
  }, [isParsed, sql]);

  const handleSubmit = async (values: Record<string, string>) => {
    const newColumns = columns.map((col) => ({
      ...col,
      value: values[col.name],
    }));
    const newSQL = generateInsertSQL(tableName, newColumns);
    setSQL(newSQL);
    push(
      <Form
        actions={
          <ActionPanel>
            <Submit title="Generate SQL" onSubmit={handleSubmit} />
          <ActionPanel>
        }
      >
        <Form.Description title="Input SQL" text="Enter your INSERT SQL statement" />
        <Form.TextArea
          id="sql"
          title="SQL Statement"
          placeholder="INSERT INTO table_name (column1, column2) VALUES ('value1', 'value2');"
          value={sql}
          onChange={setSQL}
        />
        {isParsed && (
          <>
            <Form.Description title="Table Name" text={tableName} />
            {columns.map((col) => (
              <Form.TextField
                key={col.name}
                id={col.name}
                title={col.name}
                value={col.value}
                onChange={(value) => setColumns(columns.map((c) => (c.name === col.name ? { ...c, value } : c)))}
              />
            ))}
          </>
        )}
      </Form>
    );
  };

  const handleParse = () => {
    setIsParsed(true);
  };

  return (
    <Form
      actions={
        <Form.ActionPanel>
          <Form.Submit title="Generate SQL" onSubmit={handleSubmit} />
          <Form.Button title="Parse SQL" onAction={handleParse} />
        </Form.ActionPanel>
      }
    >
      <Form.Description title="Input SQL" text="Enter your INSERT SQL statement" />
      <Form.TextArea
        id="sql"
        title="SQL Statement"
        placeholder="INSERT INTO table_name (column1, column2) VALUES ('value1', 'value2');"
        value={sql}
        onChange={setSQL}
      />
      {isParsed && (
        <>
          <Form.Description title="Table Name" text={tableName} />
          {columns.map((col) => (
            <Form.TextField
              key={col.name}
              id={col.name}
              title={col.name}
              value={col.value}
              onChange={(value) => setColumns(columns.map((c) => (c.name === col.name ? { ...c, value } : c)))}
            />
          ))}
        </>
      )}
    </Form>
  );
}