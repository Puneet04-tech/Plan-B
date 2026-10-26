"use strict";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PlanRequest } from '@shared/types';
import VoiceInput from './VoiceInput';

const FormSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'community']),
  eventDate: z.string().min(1, 'Event date is required').refine((s) => {
    const d = new Date(`${s}T00:00:00`);
    return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
  }, 'Event date must be in the future'),
  city: z.string().min(2, 'City must be at least 2 characters').max(60, 'Max 60 characters'),
  guests: z.number({ invalid_type_error: 'Guests must be a number' }).int().min(1, 'At least 1 guest').max(5000, 'Max 5000 guests'),
  budget: z.number({ invalid_type_error: 'Budget must be a number' }).min(1000, 'Budget must be at least ₹1,000').max(50000000, 'Budget is too large'),
  theme: z.string().max(60, 'Max 60 characters').optional(),
});

type FormData = z.infer<typeof FormSchema>;

// Typographic marks instead of emoji.
const EVENT_TYPES = [
  { value: 'wedding' as const, mark: 'W', label: 'Wedding' },
  { value: 'birthday' as const, mark: 'B', label: 'Birthday' },
  { value: 'community' as const, mark: 'C', label: 'Community' },
];

const DEFAULT_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

interface Props {
  onGenerate: (request: PlanRequest) => void;
  disabled: boolean;
  strings: {
    eventDetails: string;
    eventType: string;
    wedding: string;
    birthday: string;
    community: string;
    eventDate: string;
    city: string;
    guests: string;
    budget: string;
    theme: string;
    generate: string;
    generating: string;
  };
}

const EventForm = ({ onGenerate, disabled, strings }: Props) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      eventType: 'community',
      eventDate: DEFAULT_DATE,
      city: 'Delhi',
      guests: 100,
      budget: 300000,
    },
    mode: 'onBlur', // errors only after blur or submit, never on first load
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const eventType = watch('eventType');

  const onSubmit = (data: FormData) => {
    setSubmitError(null);
    onGenerate(data);
  };

  const LABELS: Record<string, string> = {
    wedding: strings.wedding,
    birthday: strings.birthday,
    community: strings.community,
  };

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate aria-label={strings.eventDetails}>
      <h2>{strings.eventDetails}</h2>

      <fieldset style={{ border: 'none', marginTop: '1rem' }}>
        <legend style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>{strings.eventType}</legend>
        <div className="event-type-group" role="radiogroup" aria-label={strings.eventType}>
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={eventType === t.value}
              className="event-type-card"
              onClick={() => setValue('eventType', t.value, { shouldValidate: true })}
            >
              <span className="mark" aria-hidden="true">{t.mark}</span>
              <span>{LABELS[t.value]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="form-field" style={{ marginTop: '1rem' }}>
        <label htmlFor="eventDate">{strings.eventDate}</label>
        <input
          id="eventDate"
          type="date"
          aria-invalid={!!errors.eventDate}
          aria-describedby={errors.eventDate ? 'eventDate-error' : undefined}
          {...register('eventDate')}
        />
        {errors.eventDate && <p className="field-error" id="eventDate-error">{errors.eventDate.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="city">{strings.city}</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            id="city"
            type="text"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-error' : undefined}
            {...register('city', { required: 'City is required' })}
            style={{ flex: 1 }}
          />
          <VoiceInput
            onTranscript={(text) => setValue('city', text, { shouldValidate: true })}
            className="voice-input-compact"
          />
        </div>
        {errors.city && <p className="field-error" id="city-error">{errors.city.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="guests">{strings.guests}</label>
        <input
          id="guests"
          type="number"
          min={1}
          max={5000}
          className="num"
          aria-invalid={!!errors.guests}
          aria-describedby={errors.guests ? 'guests-error' : undefined}
          {...register('guests', { valueAsNumber: true })}
        />
        {errors.guests && <p className="field-error" id="guests-error">{errors.guests.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="budget">{strings.budget}</label>
        <input
          id="budget"
          type="number"
          min={1000}
          step={1000}
          className="num"
          aria-invalid={!!errors.budget}
          aria-describedby={errors.budget ? 'budget-error' : undefined}
          {...register('budget', { valueAsNumber: true })}
        />
        {errors.budget && <p className="field-error" id="budget-error">{errors.budget.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="theme">{strings.theme}</label>
        <input
          id="theme"
          type="text"
          maxLength={60}
          aria-invalid={!!errors.theme}
          aria-describedby={errors.theme ? 'theme-error' : undefined}
          {...register('theme')}
        />
        {errors.theme && <p className="field-error" id="theme-error">{errors.theme.message}</p>}
      </div>

      {submitError && <p className="field-error" role="alert">{submitError}</p>}

      <button type="submit" className="btn btn-primary" disabled={disabled}>
        {disabled ? strings.generating : strings.generate}
      </button>
    </form>
  );
};

export default EventForm;
