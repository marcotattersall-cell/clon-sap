import React, { useState, useEffect } from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  Activity,
  Settings,
  Wrench,
  Thermometer,
  Gauge,
  Clock,
  MapPin,
  Flame,
  Radio,
  Zap,
  TrendingUp,
  PlusCircle,
  History,
  BarChart2,
  Server
} from 'lucide-react';
import { CreateAssetModal } from '../modals/CreateAssetModal';
import { getTelemetryHistory } from '../../services/iotIngestionService';

export const AssetHierarchyTree = () => {
  const { assets, workOrders, addToast } = useSAP();
  const [selectedAsset, setSelectedAsset] = useState(assets[0] || null);
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch Time-Series Telemetry History whenever selected asset changes
  useEffect(() => {
    if (!selectedAsset) return;
    let isMounted = true;
    setIsLoadingLogs(true);

    getTelemetryHistory(selectedAsset.id).then(logs => {
      if (isMounted) {
        setTelemetryLogs(logs);
        setIsLoadingLogs(false);
      }
    });

    return () => { isMounted = false; };
  }, [selectedAsset]);

  // Fleet Health Metrics Calculations
  const totalAssets = assets.length;
  const operativeAssets = assets.filter(a => a.status === 'OPERATIVE' || a.status === 'Operational');
  const maintenanceAssets = assets.filter(a => a.status === 'MAINTENANCE' || a.status === 'Down' || a.status === 'Warning');
  const availabilityRate = totalAssets > 0 ? Math.round((operativeAssets.length / totalAssets) * 100) : 100;
  const avgHealthScore = totalAssets > 0 ? Math.round(assets.reduce((acc, a) => acc + (a.healthScore || a.healthIndex || 90), 0) / totalAssets) : 90;

  // Trigger IoT Telemetry Burst for a specific asset
  const triggerIoTBurst = async (targetAsset) => {
    if (!targetAsset) return;
    const { processIoTTelemetry } = await import('../../services/iotIngestionService');
    const randomTemp = Math.floor(88 + Math.random() * 24); // 88°C to 112°C
    const randomVib = Number((3.2 + Math.random() * 4.8).toFixed(1)); // 3.2 to 8.0 mm/s
    const newHrs = (targetAsset.hourmeter || 4000) + Math.floor(Math.random() * 5 + 1);

    const res = await processIoTTelemetry(
      {
        equipmentId: targetAsset.id,
        hourmeter: newHrs,
        engineTemp: randomTemp,
        vibrationRms: randomVib,
        healthScore: randomTemp > 102 || randomVib > 6.5 ? 62 : 96
      },
      assets,
      true
    );

    addToast(res.message, res.triggeredAlert ? 'warning' : 'success');

    // Refresh Time-Series history
    getTelemetryHistory(targetAsset.id).then(logs => setTelemetryLogs(logs));
  };

  // Trigger IoT Burst for ALL assets in fleet
  const triggerFleetBurst = async () => {
    const { processIoTTelemetry } = await import('../../services/iotIngestionService');
    let alertCount = 0;

    for (const asset of assets) {
      const randomTemp = Math.floor(88 + Math.random() * 22);
      const randomVib = Number((3.0 + Math.random() * 4.5).toFixed(1));
      const newHrs = (asset.hourmeter || 4000) + Math.floor(Math.random() * 3 + 1);

      const res = await processIoTTelemetry(
        {
          equipmentId: asset.id,
          hourmeter: newHrs,
          engineTemp: randomTemp,
          vibrationRms: randomVib,
          healthScore: randomTemp > 102 || randomVib > 6.5 ? 60 : 95
        },
        assets,
        true
      );

      if (res.triggeredAlert) alertCount++;
    }

    addToast(
      `📡 Ráfaga IoT ejecutada en la Flota Completa (${totalAssets} activos). ${alertCount > 0 ? `⚠️ ${alertCount} anomalías detectadas.` : '✅ Toda la flota dentro de norma.'}`,
      alertCount > 0 ? 'warning' : 'success'
    );

    if (selectedAsset) {
      getTelemetryHistory(selectedAsset.id).then(logs => setTelemetryLogs(logs));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Módulo PM - Serverless IoT Webhook & Time-Series DB</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Jerarquía de Activos & Salud de Flota (IE03)</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                REST API Ready 100%
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Monitoreo continuo de horómetros, temperaturas de motor, niveles de vibración RMS y serie de tiempo histórica (Time-Series DB) procesada mediante Firebase Cloud Functions Serverless Webhook.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={triggerFleetBurst}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg transition-all cursor-pointer ring-1 ring-purple-400/30"
              title="Simular ingesta de telemetría IoT en toda la flota de maquinaria"
            >
              <Radio className="w-4 h-4 animate-pulse text-purple-200" />
              <span>📡 Ráfaga IoT Flota Completa</span>
            </button>
            <button
              onClick={() => setIsCreateAssetOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>＋ Crear Equipo IE01</span>
            </button>
          </div>
        </div>

        {/* Fleet KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Disponibilidad Flota</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{availabilityRate}%</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Índice Salud Promedio</span>
              <span className="text-lg font-black text-sky-400 font-mono">{avgHealthScore}%</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Equipos en Mantención</span>
              <span className="text-lg font-black text-amber-400 font-mono">{maintenanceAssets.length} / {totalAssets}</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Webhook Endpoint REST</span>
              <span className="text-xs font-bold text-purple-300 font-mono">POST /api/v1/iot/telemetry</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Asset Tree & Telemetry Quick Cards */}
        <div className="lg:col-span-1 fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Equipos Registrados ({totalAssets})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">PLANT-01</span>
          </div>

          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
            {assets.map(asset => {
              const isSelected = selectedAsset?.id === asset.id;
              const relatedWOs = workOrders.filter(w => w.equipmentId === asset.id);
              const score = asset.healthScore || asset.healthIndex || 90;
              const iot = asset.lastIoTTelemetry;

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sap-blue text-white border-sap-blue shadow-lg scale-[1.01]'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-sap-blue/60'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono">{asset.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      asset.status === 'OPERATIVE' || asset.status === 'Operational' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' :
                      'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 animate-pulse'
                    }`}>
                      {asset.status === 'OPERATIVE' || asset.status === 'Operational' ? 'OPERATIVO' : 'MANTENCIÓN'}
                    </span>
                  </div>

                  <div className="font-bold text-sm mt-1 truncate">
                    {asset.name}
                  </div>

                  {/* IoT Sensors Quick Metrics Preview */}
                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-[11px]">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span>{asset.hourmeter || 0} hrs</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Thermometer className={`w-3.5 h-3.5 shrink-0 ${iot?.engineTemp > 102 ? 'text-rose-400 animate-bounce' : 'opacity-70'}`} />
                      <span>{iot?.engineTemp ? `${iot.engineTemp}°C` : '92°C'}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Gauge className={`w-3.5 h-3.5 shrink-0 ${iot?.vibrationRms > 6.5 ? 'text-amber-400' : 'opacity-70'}`} />
                      <span>{iot?.vibrationRms ? `${iot.vibrationRms} mm/s` : '3.8 mm/s'}</span>
                    </div>

                    <div className="flex items-center space-x-1 font-semibold">
                      <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Salud: {score}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Asset Telemetry & Time-Series Cockpit */}
        <div className="lg:col-span-2 fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          {selectedAsset ? (
            <div className="space-y-6">
              {/* Asset Header Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-sap-blue">{selectedAsset.id}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-semibold">{selectedAsset.category}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-mono">{selectedAsset.serialNumber || 'SN-2026-99'}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedAsset.name}
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => triggerIoTBurst(selectedAsset)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                    title="Enviar ráfaga de sensores IoT a este equipo"
                  >
                    <Activity className="w-4 h-4 animate-pulse text-purple-200" />
                    <span>Inyectar Telemetría IoT</span>
                  </button>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Salud OEE</span>
                    <div className="text-2xl font-black text-emerald-500 font-mono">
                      {selectedAsset.healthScore || selectedAsset.healthIndex || 90}%
                    </div>
                  </div>
                </div>
              </div>

              {/* IoT Live Sensors Gauges */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-purple-500 animate-pulse" />
                  <span>Sensores de Telemetría IoT en Vivo (Bus CAN J1939)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Gauge 1: Temperature */}
                  <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                    (selectedAsset.lastIoTTelemetry?.engineTemp || 92) > 102
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-300'
                      : (selectedAsset.lastIoTTelemetry?.engineTemp || 92) > 96
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Thermometer className="w-4 h-4 text-rose-500" />
                        Temp. Refrigerante Motor
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                        Max 102°C
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono">
                      {selectedAsset.lastIoTTelemetry?.engineTemp ? `${selectedAsset.lastIoTTelemetry.engineTemp}°C` : '92.4°C'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {(selectedAsset.lastIoTTelemetry?.engineTemp || 92) > 102 ? '⚠️ ALERTA SOBRECALENTAMIENTO' : 'Rango Térmico Normal'}
                    </div>
                  </div>

                  {/* Gauge 2: Bearing Vibration RMS */}
                  <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                    (selectedAsset.lastIoTTelemetry?.vibrationRms || 3.8) > 6.5
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-300'
                      : (selectedAsset.lastIoTTelemetry?.vibrationRms || 3.8) > 5.0
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-amber-500" />
                        Vibración RMS Rodamientos
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                        Max 6.5 mm/s
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono">
                      {selectedAsset.lastIoTTelemetry?.vibrationRms ? `${selectedAsset.lastIoTTelemetry.vibrationRms} mm/s` : '3.8 mm/s'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {(selectedAsset.lastIoTTelemetry?.vibrationRms || 3.8) > 6.5 ? '⚠️ ANOMALÍA ESTRUCTURAL' : 'Amplitud Armónica OK'}
                    </div>
                  </div>

                  {/* Gauge 3: Accumulator (Horometer for Machinery vs Odometer for Trucks/Transport) */}
                  {selectedAsset?.category?.includes('Transporte') || selectedAsset?.category?.includes('Flota') || selectedAsset?.category?.includes('Camión') ? (
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <Gauge className="w-4 h-4 text-sky-500" />
                          Odómetro de Ruta (km)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono">
                          Camión / Flota
                        </span>
                      </div>
                      <div className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                        {(selectedAsset.odometer || 0).toLocaleString('es-CL')} km
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Próxima Pauta PM: {(Math.ceil((selectedAsset.odometer || 10000) / 10000) * 10000).toLocaleString('es-CL')} km (Intervalo 10.000 km)
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-sky-500" />
                          Horómetro de Motor (hrs)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono">
                          Maquinaria
                        </span>
                      </div>
                      <div className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                        {selectedAsset.hourmeter || 4250} hrs
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Próxima Pauta PM: {(Math.ceil((selectedAsset.hourmeter || 250) / 250) * 250)} hrs (Intervalo 250 hrs)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Time-Series DB Telemetry History Trend Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-purple-500" />
                    <span>Histórico Serie de Tiempo (Time-Series DB Logs)</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {telemetryLogs.length} ráfagas registradas
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Timestamp / Hora</th>
                          <th className="py-2.5 px-3">Temp °C</th>
                          <th className="py-2.5 px-3">Vibración RMS</th>
                          <th className="py-2.5 px-3">Horómetro</th>
                          <th className="py-2.5 px-3">Salud OEE</th>
                          <th className="py-2.5 px-3">Estado / Alerta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60 font-mono">
                        {telemetryLogs.slice(-5).reverse().map(log => (
                          <tr key={log.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors">
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                              {new Date(log.timestamp).toLocaleTimeString('es-CL')}
                            </td>
                            <td className={`py-2 px-3 font-bold ${log.engineTemp > 102 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                              {log.engineTemp}°C
                            </td>
                            <td className={`py-2 px-3 font-bold ${log.vibrationRms > 6.5 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                              {log.vibrationRms} mm/s
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                              {log.hourmeter} hrs
                            </td>
                            <td className="py-2 px-3 font-bold text-emerald-500">
                              {log.healthScore}%
                            </td>
                            <td className="py-2 px-3">
                              {log.alertReason ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                                  ⚠️ {log.alertReason}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                                  Norma OK
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Linked Work Orders History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-sap-blue" />
                  <span>Historial de Órdenes de Mantenimiento PM Vinculadas</span>
                </h4>

                <div className="space-y-2">
                  {workOrders.filter(w => w.equipmentId === selectedAsset.id).map(wo => (
                    <div key={wo.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-sap-blue mr-2">{wo.id}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{wo.title}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {wo.status}
                        </span>
                        <span className="font-mono font-bold text-emerald-500">${wo.actualCost}</span>
                      </div>
                    </div>
                  ))}

                  {workOrders.filter(w => w.equipmentId === selectedAsset.id).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                      Sin órdenes de mantenimiento previas para este activo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Seleccione un activo de la lista para ver su expediente técnico y telemetría de sensores completa.
            </div>
          )}
        </div>
      </div>

      <CreateAssetModal
        isOpen={isCreateAssetOpen}
        onClose={() => setIsCreateAssetOpen(false)}
      />
    </div>
  );
};
