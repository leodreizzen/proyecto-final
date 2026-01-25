import {TableToShow} from "@/lib/definitions/resolutions";

export function TableRenderer({table}: { table: TableToShow }) {
    if (!table) return null;
    return (
        <div className="overflow-x-auto border rounded-md my-4">
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
    );
}