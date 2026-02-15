using FluentValidation;
using ASideNote.Application.DTOs.Users;

namespace ASideNote.Application.Validators.Users;

public sealed class UpdatePreferencesRequestValidator : AbstractValidator<UpdatePreferencesRequest>
{
    public UpdatePreferencesRequestValidator()
    {
        RuleFor(x => x.Theme)
            .NotEmpty().WithMessage("Theme is required.")
            .Must(t => t is "Light" or "Dark" or "System")
            .WithMessage("Theme must be Light, Dark, or System.");
    }
}
