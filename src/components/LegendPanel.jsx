import { Edit, Target, Link2, Trash2, Mouse, Hand, Save } from 'lucide-react'

export default function LegendPanel() {
    return (
        <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-md text-sm max-w-[280px] border border-gray-200">
            <div className="font-medium text-gray-700 mb-3 text-sm flex items-center gap-1.5">
                <Edit size={16} className="text-blue-600" />
                <span>Editor Guide</span>
            </div>
            <div className="flex flex-col gap-1.5 text-gray-600 leading-5 text-xs">
                <div className="flex items-start gap-1.5">
                    <Target size={16} className="min-w-4 text-green-600 mt-0.5" />
                    <div>
                        <strong className="text-gray-700">Right-click nodes:</strong> Edit text & handles
                    </div>
                </div>
                <div className="flex items-start gap-1.5">
                    <Link2 size={16} className="min-w-4 text-blue-600 mt-0.5" />
                    <div>
                        <strong className="text-gray-700">Drag handles:</strong> Create connections
                    </div>
                </div>
                <div className="flex items-start gap-1.5">
                    <Trash2 size={16} className="min-w-4 text-red-600 mt-0.5" />
                    <div>
                        <strong className="text-gray-700">Delete:</strong> Select edge + Delete key
                    </div>
                </div>
                <div className="flex items-start gap-1.5">
                    <Mouse size={16} className="min-w-4 text-purple-600 mt-0.5" />
                    <div>
                        <strong className="text-gray-700">Multi-select:</strong> Shift + Click
                    </div>
                </div>
                <div className="flex items-start gap-1.5">
                    <Hand size={16} className="min-w-4 text-orange-600 mt-0.5" />
                    <div>
                        <strong className="text-gray-700">Hand tool:</strong> Hold 'H' to pan with left-click
                    </div>
                </div>
                <div className="flex items-start gap-1.5 py-0.5 border-t border-gray-200/60 mt-2 pt-2">
                    <Save size={16} className="min-w-4 text-amber-600 mt-0.5" />
                    <div className="italic text-gray-500">
                        <strong className="text-amber-600">Save Layout:</strong> Sets current as default
                    </div>
                </div>
            </div>
        </div>
    )
}