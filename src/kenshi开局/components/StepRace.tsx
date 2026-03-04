import React from 'react';
import { motion } from 'motion/react';
import { CharacterData } from '../types';
import { RACES } from '../data';
import { User, Dna } from 'lucide-react';

interface StepRaceProps {
  data: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
}

export const StepRace: React.FC<StepRaceProps> = ({ data, updateData }) => {
  const selectedRace = RACES.find(r => r.id === data.race);

  React.useEffect(() => {
    if (!data.race && RACES.length > 0) {
      const firstRace = RACES[0];
      updateData({ race: firstRace.id, subrace: firstRace.subraces[0]?.id ?? '' });
    }
  }, [data.race, updateData]);

  React.useEffect(() => {
    if (selectedRace && !data.subrace && selectedRace.subraces.length > 0) {
      updateData({ subrace: selectedRace.subraces[0].id });
    }
  }, [data.subrace, selectedRace, updateData]);

  return (
    <div className="h-full flex flex-col gap-8">
      <div className="text-center mb-4">
        <h2 className="text-4xl font-serif text-white tracking-wider">选择种族</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* Race Categories */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 content-start">
          {RACES.map((race) => (
            <motion.button
              key={race.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateData({ race: race.id, subrace: '' })}
              className={`
                p-6 rounded-xl border text-left transition-all relative overflow-hidden group
                ${data.race === race.id
                  ? 'bg-white/10 border-[#C2B280] shadow-lg'
                  : 'bg-black/40 border-white/10 hover:bg-white/5'}
              `}
            >
              <div className="relative z-10">
                <h3 className={`text-xl font-serif font-bold mb-1 ${data.race === race.id ? 'text-[#C2B280]' : 'text-white'}`}>
                  {race.title}
                </h3>
                <p className="text-xs text-white/50 line-clamp-2">{race.description}</p>
              </div>
              {data.race === race.id && (
                <motion.div
                  layoutId="race-glow"
                  className="absolute inset-0 bg-gradient-to-r from-[#C2B280]/10 to-transparent"
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Subrace Selection & Details */}
        <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-xl p-8 relative">
          {selectedRace ? (
            <motion.div
              key={selectedRace.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#C2B280]/20 rounded-lg text-[#C2B280]">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-serif text-white">{selectedRace.title}</h3>
                  <p className="text-white/60">{selectedRace.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-serif text-[#C2B280] border-b border-white/10 pb-2 flex items-center gap-2">
                  <Dna size={18} />
                  亚种选择
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRace.subraces.map((subrace) => (
                    <button
                      key={subrace.id}
                      onClick={() => updateData({ subrace: subrace.id })}
                      className={`
                        p-4 rounded-lg border text-left transition-all
                        ${data.subrace === subrace.id
                          ? 'bg-[#C2B280] text-black border-[#C2B280]'
                          : 'bg-white/5 border-white/10 text-white hover:border-white/30'}
                      `}
                    >
                      <div className="font-bold font-serif mb-1">{subrace.title}</div>
                      <div className={`text-xs ${data.subrace === subrace.id ? 'text-black/70' : 'text-white/50'}`}>
                        {subrace.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
              <User size={48} className="mb-4 opacity-50" />
              <p className="font-serif">选择一个种族以查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
