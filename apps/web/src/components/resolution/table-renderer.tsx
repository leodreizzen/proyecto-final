import {TableToShow} from "@/lib/definitions/resolutions";

export function TableRenderer({tables}: { tables: TableToShow[] }) {
    if (!tables || tables.length === 0) return null;
    return (
        <div className="space-y-4 my-4">
            {tables.map((table, idx) => (
                <div key={idx} className="overflow-x-auto border rounded-md">
                    <table className="w-full text-sm text-left">
                        <tbody>
                        {/*TODO table header*/}
                        {table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b last:border-0 hover:bg-muted/50">
                                {row.cells.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 border-r last:border-0 align-top">
                                        {cell.text}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}