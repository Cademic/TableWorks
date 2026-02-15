using FluentValidation;
using ASideNote.Application.DTOs.Users;

namespace ASideNote.Application.Validators.Users;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required.")
            .MinimumLength(3).WithMessage("Username must be at least 3 characters.")
            .MaximumLength(50).WithMessage("Username must not exceed 50 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email is required.");

        RuleFor(x => x.Bio)
            .MaximumLength(200).WithMessage("Bio must not exceed 200 characters.")
            .When(x => x.Bio is not null);

        RuleFor(x => x.ProfilePictureKey)
            .MaximumLength(50).WithMessage("Profile picture key must not exceed 50 characters.")
            .When(x => x.ProfilePictureKey is not null);
    }
}
