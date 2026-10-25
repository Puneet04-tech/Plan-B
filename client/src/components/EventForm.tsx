"use strict";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PlanRequest } from '@shared/types';

const FormSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'community']),
  eventDate: z
    .string()
    .min(1, 'Event date is required')
    .refine((s) => {
      const d = new Date(`${s}T00:00:00`);
      return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
    }, 'Event date must be in the future'),
  city: z.string().min(2, 'City must be at least 2 characters').max(60, 'Max 60 characters'),
  guests: z.number({ invalid_type_error: 'Guests must be a number' }).int().min(1, 'At least 1 guest').max(5000, 'Max 5000 guests'),
  budget: z.number({ invalid_type_error: 'Budget must be a number' }).min(1000, 'Budget must be at least ₹1,000').max(50000000, 'Budget is too large'),
  theme: z.string().max(60, 'Max 60 characters').optional(),
});

type FormData = z.infer<typeof FormSchema>;

const EVENT_TYPES = [
  { value: 'wedding' as const, label: 'Wedding', icon: '💍' },
  { value: 'birthday' as const, label: 'Birthday', icon: '🎂' },
  { value: 'community' as const, label: 'Community', icon: '🏘️' },
];

interface Props {
  onGenerate: (request: PlanRequest) => void;
  disabled: boolean;
}

const EventForm = ({ onGenerate, disabled }: Props) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { eventType: 'wedding', guests: 100, budget: 500000 },
    mode: 'onBlur',
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const eventType = watch('eventType');

  const onSubmit = (data: FormData) => {
    setSubmitError(null);
    onGenerate(data);
  };

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Event details">
      <h2>Event details</h2>

      <fieldset style={{ border: 'none', marginTop: '1rem' }}>
        <legend style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Event type</legend>
        <div className="event-type-group" role="radiogroup" aria-label="Event type">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={eventType === t.value}
              className="event-type-card"
              onClick={() => setValue('eventType', t.value, { shouldValidate: true })}
            >
              <span className="event-type-icon" aria-hidden="true">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {errors.eventType && <p className="field-error" id="eventType-error">{errors.eventType.message}</p>}
      </fieldset>

      <div className="form-field" style={{ marginTop: '1rem' }}>
        <label htmlFor="eventDate">Event date</label>
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
        <label htmlFor="city">City</label>
        <input
          id="city"
          type="text"
          placeholder="e.g., Mumbai"
          aria-invalid={!!errors.city}
          aria-describedby={errors.city ? 'city-error' : undefined}
          {...register('city', { required: 'City is required' })}
        />
        {errors.city && <p className="field-error" id="city-error">{errors.city.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="guests">Guests</label>
        <input
          id="guests"
          type="number"
          min={1}
          max={5000}
          aria-invalid={!!errors.guests}
          aria-describedby={errors.guests ? 'guests-error' : undefined}
          {...register('guests', { valueAsNumber: true })}
        />
        {errors.guests && <p className="field-error" id="guests-error">{errors.guests.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="budget">Total budget (₹)</label>
        <input
          id="budget"
          type="number"
          min={1000}
          step={1000}
          aria-invalid={!!errors.budget}
          aria-describedby={errors.budget ? 'budget-error' : undefined}
          {...register('budget', { valueAsNumber: true })}
        />
        {errors.budget && <p className="field-error" id="budget-error">{errors.budget.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="theme">Theme (optional)</label>
        <input
          id="theme"
          type="text"
          placeholder="e.g., Vintage Romance"
          maxLength={60}
          aria-invalid={!!errors.theme}
          aria-describedby={errors.theme ? 'theme-error' : undefined}
          {...register('theme')}
        />
        {errors.theme && <p className="field-error" id="theme-error">{errors.theme.message}</p>}
      </div>

      {submitError && <p className="field-error" role="alert">{submitError}</p>}

      <button type="submit" className="btn btn-primary" disabled={disabled}>
        {disabled ? 'Generating…' : 'Generate Plan'}
      </button>
    </form>
  );
};

export default EventForm;
