import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const countryOptions = [
  'Global (All Countries)',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'India',
  'Nigeria',
  'Kenya',
  'South Africa',
  'Ghana',
];

export default function Step3Targeting() {
  const { data, updateData } = useNewTaskStore();

  const handleCountryChange = (country: string) => {
    const selected = data.countries || [];
    if (selected.includes(country)) {
      updateData({ countries: selected.filter((c) => c !== country) });
    } else {
      updateData({ countries: [...selected, country] });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label className="font-semibold mb-2">Countries & Regions</Label>
        <div className="text-sm text-muted-foreground mb-2">Select the countries or regions where you want to target participants</div>
        <div className="flex flex-col gap-1">
          {countryOptions.map((country) => (
            <label key={country} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!data.countries?.includes(country)}
                onChange={() => handleCountryChange(country)}
                className="accent-[#363062]"
              />
              <span>{country}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label className="font-semibold mb-2">Demographics</Label>
        <div className="text-sm text-muted-foreground mb-2">Define demographic requirements for participants</div>
        <div className="mb-4">
          <Label>Gender</Label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="gender"
                checked={data.gender === 'male'}
                onChange={() => updateData({ gender: 'male' })}
                className="accent-[#363062]"
              />
              Male
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="gender"
                checked={data.gender === 'female'}
                onChange={() => updateData({ gender: 'female' })}
                className="accent-[#363062]"
              />
              Female
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="gender"
                checked={data.gender === 'all' || !data.gender}
                onChange={() => updateData({ gender: 'all' })}
                className="accent-[#363062]"
              />
              All
            </label>
          </div>
        </div>
        <div className="flex gap-4 items-end">
          <div>
            <Label htmlFor="minAge">Min Age</Label>
            <Input
              id="minAge"
              type="number"
              min={0}
              value={data.minAge ?? 18}
              onChange={e => updateData({ minAge: Number(e.target.value) })}
              className="w-20"
            />
          </div>
          <span className="mb-2">to</span>
          <div>
            <Label htmlFor="maxAge">Max Age</Label>
            <Input
              id="maxAge"
              type="number"
              min={0}
              value={data.maxAge ?? 100}
              onChange={e => updateData({ maxAge: Number(e.target.value) })}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 