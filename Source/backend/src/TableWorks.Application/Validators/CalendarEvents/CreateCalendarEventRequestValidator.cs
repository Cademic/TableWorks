using FluentValidation;
using TableWorks.Application.DTOs.CalendarEvents;

namespace TableWorks.Application.Validators.CalendarEvents;

public sealed class CreateCalendarEventRequestValidator : AbstractValidator<CreateCalendarEventRequest>
{
    public CreateCalendarEventRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.Color)
            .NotEmpty().WithMessage("Color is required.")
            .MaximumLength(20).WithMessage("Color must not exceed 20 characters.");

        RuleFor(x => x.EventType)
            .NotEmpty().WithMessage("EventType is required.")
            .Must(t => t is "Event" or "Note").WithMessage("EventType must be 'Event' or 'Note'.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("End date must be on or after start date.")
            .When(x => x.EndDate.HasValue);
    }
}
