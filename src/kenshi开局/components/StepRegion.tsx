import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { REGIONS, SCENARIOS, TOWN_DESCRIPTIONS } from '../data';
import { CharacterData } from '../types';

interface StepRegionProps {
  data: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
}

export const StepRegion: React.FC<StepRegionProps> = ({ data, updateData }) => {
  const selectedScenario = SCENARIOS.find(s => s.id === data.scenario) as
    | { allowedRegions?: string[]; fixedRegion?: string; fixedTown?: string }
    | undefined;
  const allowedRegionIds = selectedScenario?.allowedRegions;
  const fixedRegion = selectedScenario?.fixedRegion;
  const fixedTown = selectedScenario?.fixedTown;
  const specialRegionIds = [
    'iron_valley',
    'stenn_desert',
    'bonefields_south',
    'cannibal_plains',
    'stobers_garden',
    'rebirth',
  ];
  const availableRegions = allowedRegionIds
    ? REGIONS.filter(region => allowedRegionIds.includes(region.id))
    : REGIONS.filter(region => !specialRegionIds.includes(region.id));

  const selectedRegion = availableRegions.find(r => r.id === data.region);

  React.useEffect(() => {
    if (fixedRegion) {
      const fixedRegionData = REGIONS.find(region => region.id === fixedRegion);
      updateData({
        region: fixedRegion,
        town: fixedTown ?? fixedRegionData?.towns[0] ?? '',
      });
      return;
    }
    if (!data.region && availableRegions.length > 0) {
      updateData({ region: availableRegions[0].id, town: availableRegions[0].towns[0] ?? '' });
    }
  }, [availableRegions, data.region, fixedRegion, fixedTown, updateData]);

  React.useEffect(() => {
    if (fixedTown) {
      updateData({ town: fixedTown });
      return;
    }
    if (selectedRegion && !data.town && selectedRegion.towns.length > 0) {
      updateData({ town: selectedRegion.towns[0] });
    }
  }, [data.town, fixedTown, selectedRegion, updateData]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8">
      {/* Left: Region List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
        <h2 className="text-3xl font-serif text-white mb-4">出生区域</h2>
        {availableRegions.map((region, index) => (
          <motion.div
            key={region.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => (!fixedRegion ? updateData({ region: region.id, town: '' }) : undefined)}
            className={`
              p-4 rounded-lg border transition-all duration-300
              ${
                data.region === region.id
                  ? 'bg-white/10 border-[#C2B280] text-white'
                  : 'bg-black/40 border-white/10 text-white/60'
              }
              ${fixedRegion ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-white/5'}
            `}
          >
            <h3 className="font-serif font-bold text-lg">{region.title}</h3>
            <p className="text-xs mt-1 opacity-70">危险等级: {region.danger}</p>
          </motion.div>
        ))}
        {allowedRegionIds && (
          <p className="text-xs text-[#C2B280]/80 mt-2 leading-relaxed">当前开局限定出生区域，仅可在指定区域内选择。</p>
        )}
        {fixedRegion && <p className="text-xs text-[#C2B280]/80 mt-2 leading-relaxed">当前开局锁定出生区域。</p>}
      </div>

      {/* Right: Details & Town Selection */}
      <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden">
        {selectedRegion ? (
          <motion.div
            key={selectedRegion.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col"
          >
            <div className="absolute top-0 right-0 p-32 bg-[#C2B280] opacity-5 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-4xl font-serif text-[#C2B280] mb-4">{selectedRegion.title}</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-2xl">{selectedRegion.description}</p>

            <div className="mt-auto">
              <h3 className="text-xl font-serif text-white mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-[#C2B280]" />
                选择起始城镇
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedRegion.towns.map(town => (
                  <button
                    key={town}
                    onClick={() => (!fixedTown ? updateData({ town }) : undefined)}
                    className={`
                      text-left px-4 py-3 rounded border transition-all
                      ${
                        data.town === town
                          ? 'bg-[#C2B280] text-black border-[#C2B280] font-bold'
                          : 'bg-black/60 border-white/20 text-white/70'
                      }
                      ${fixedTown ? 'cursor-not-allowed opacity-60' : 'hover:border-white/50'}
                    `}
                  >
                    <div className="font-semibold">{town}</div>
                    {TOWN_DESCRIPTIONS[town] && (
                      <div className={`text-xs mt-1 ${data.town === town ? 'text-black/70' : 'text-white/50'}`}>
                        {TOWN_DESCRIPTIONS[town]}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {fixedTown && <p className="text-xs text-[#C2B280]/80 mt-3">当前开局锁定起始城镇。</p>}
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center text-white/30 italic font-serif">
            请从左侧选择一个区域...
          </div>
        )}
      </div>
    </div>
  );
};
