import { Check, Edit3 } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/src/auth/AuthContext';
import { saveEngineerDraft } from '@/src/api/applications';
import { SurveyCard } from '@/src/cdrms/components/SurveyLayout';
import { useProject } from '@/src/cdrms/project/ProjectContext';
import { alertDraftError } from '@/src/cdrms/project/draft-api';
import { DIRECTION_META, type Cardinal } from '@/src/cdrms/project/types';

const CARDINALS: Cardinal[] = ['N', 'S', 'E', 'W'];

/** Schedules (site around) — Step 3 Dimensions only. */
export function SchedulesEditorCard() {
  const { accessToken } = useAuth();
  const { draft, setDirection } = useProject();
  const [schedulesEditing, setSchedulesEditing] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState({ N: '', S: '', E: '', W: '' });
  const [saving, setSaving] = useState(false);

  const beginScheduleEdit = () => {
    setScheduleDraft({
      N: draft.directions.N,
      S: draft.directions.S,
      E: draft.directions.E,
      W: draft.directions.W,
    });
    setSchedulesEditing(true);
  };

  const saveScheduleEdit = async () => {
    const next = {
      N: scheduleDraft.N.trim(),
      S: scheduleDraft.S.trim(),
      E: scheduleDraft.E.trim(),
      W: scheduleDraft.W.trim(),
    };
    ;(['N', 'S', 'E', 'W'] as const).forEach((k) => {
      setDirection(k, next[k]);
    });
    if (draft.backendApplicationId && accessToken) {
      setSaving(true);
      try {
        await saveEngineerDraft(accessToken, draft.backendApplicationId, {
          scheduleNorth: next.N,
          scheduleSouth: next.S,
          scheduleWest: next.W,
          scheduleEast: next.E,
        });
        setSchedulesEditing(false);
      } catch (err) {
        alertDraftError(err, 'Could not save schedules');
      } finally {
        setSaving(false);
      }
      return;
    }
    setSchedulesEditing(false);
  };

  return (
    <SurveyCard>
      <VStack className="px-[18px] py-4" space="sm">
        <HStack className="items-center justify-between">
          <VStack className="min-w-0 flex-1 pr-2">
            <Text className="text-[15px] font-extrabold" style={{ color: '#0F172A' }}>
              Schedules (site around)
            </Text>
            <Text className="mt-0.5 text-[11px]" style={{ color: '#94A3B8' }}>
              Prefills from ZC — tap Edit to update
            </Text>
          </VStack>
          <Pressable
            onPress={() =>
              void (schedulesEditing ? saveScheduleEdit() : beginScheduleEdit())
            }
            disabled={saving}
            className="active:opacity-80"
            style={{
              height: 34,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#BFDBFE',
              backgroundColor: schedulesEditing ? '#2563EB' : '#EFF6FF',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {schedulesEditing ? (
              <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <Edit3 size={14} color="#2563EB" strokeWidth={2.5} />
            )}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: schedulesEditing ? '#FFFFFF' : '#2563EB',
              }}
            >
              {saving ? 'Saving…' : schedulesEditing ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        </HStack>

        {CARDINALS.map((k) => {
          const meta = DIRECTION_META[k];
          const value = schedulesEditing ? scheduleDraft[k] : draft.directions[k];
          return (
            <VStack key={`dim-sched-${k}`} space="xs">
              <Text
                className="text-[10px] font-extrabold uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                Schedule {k} · {meta.label}
              </Text>
              {schedulesEditing ? (
                <TextInput
                  value={value}
                  onChangeText={(t) => setScheduleDraft((d) => ({ ...d, [k]: t }))}
                  placeholder={`What is on the ${meta.label.toLowerCase()} side?`}
                  placeholderTextColor="#94A3B8"
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#0F172A',
                  }}
                />
              ) : (
                <Box
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    backgroundColor: '#F8FAFC',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: value ? '#0F172A' : '#94A3B8',
                    }}
                  >
                    {value || '—'}
                  </Text>
                </Box>
              )}
            </VStack>
          );
        })}
      </VStack>
    </SurveyCard>
  );
}
