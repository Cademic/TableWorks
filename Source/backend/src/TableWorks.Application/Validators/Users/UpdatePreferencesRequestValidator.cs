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

        RuleFor(x => x.AutoSaveInterval)
            .InclusiveBetween(1, 60).WithMessage("Auto-save interval must be between 1 and 60 seconds.");

        RuleFor(x => x.DefaultView)
            .NotEmpty().WithMessage("Default view is required.")
            .Must(v => v is "Table" or "Board" or "List")
            .WithMessage("Default view must be Table, Board, or List.");
    }
}
